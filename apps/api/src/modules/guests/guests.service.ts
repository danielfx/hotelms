import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from './dto';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  async findAll(propertyId: string, filter: GuestFilterDto) {
    const where: Prisma.GuestWhereInput = { propertyId };

    if (filter.q) {
      where.OR = [
        { firstName: { contains: filter.q, mode: 'insensitive' } },
        { lastName: { contains: filter.q, mode: 'insensitive' } },
        { email: { contains: filter.q, mode: 'insensitive' } },
        { phone: { contains: filter.q } },
        { passportNo: { contains: filter.q } },
      ];
    }
    if (filter.nationality) where.nationality = filter.nationality;
    if (filter.vip !== undefined) where.vip = filter.vip === 'true';
    if (filter.blacklisted !== undefined) where.blacklisted = filter.blacklisted === 'true';

    const page = Number(filter.page ?? 1);
    const limit = Number(filter.limit ?? 20);
    const skip = (page - 1) * limit;

    const [guests, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        include: {
          _count: { select: { reservations: true } },
        },
        orderBy: filter.sortBy === 'revenue'
          ? { totalRevenue: 'desc' }
          : filter.sortBy === 'stays'
          ? { totalStays: 'desc' }
          : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.guest.count({ where }),
    ]);

    return {
      guests,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, propertyId: string) {
    const guest = await this.prisma.guest.findFirst({
      where: { id, propertyId },
      include: {
        reservations: {
          include: { room: { include: { roomType: true } } },
          orderBy: { checkIn: 'desc' },
          take: 20,
        },
      },
    });
    if (!guest) throw new NotFoundException('Guest not found');
    return guest;
  }

  async search(propertyId: string, q: string) {
    if (!q || q.length < 2) return [];
    return this.prisma.guest.findMany({
      where: {
        propertyId,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { passportNo: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { totalStays: 'desc' },
    });
  }

  async create(propertyId: string, dto: CreateGuestDto) {
    // Check for potential duplicate
    let duplicate = null;
    if (dto.email) {
      duplicate = await this.prisma.guest.findFirst({
        where: { propertyId, email: dto.email },
      });
    }

    const guest = await this.prisma.guest.create({
      data: { ...dto, propertyId },
    });

    return { guest, potentialDuplicate: duplicate };
  }

  async update(id: string, propertyId: string, dto: UpdateGuestDto) {
    const guest = await this.prisma.guest.findFirst({ where: { id, propertyId } });
    if (!guest) throw new NotFoundException('Guest not found');

    return this.prisma.guest.update({
      where: { id },
      data: dto,
    });
  }

  async toggleVip(id: string, propertyId: string) {
    const guest = await this.prisma.guest.findFirst({ where: { id, propertyId } });
    if (!guest) throw new NotFoundException('Guest not found');
    return this.prisma.guest.update({ where: { id }, data: { vip: !guest.vip } });
  }

  async toggleBlacklist(id: string, propertyId: string, reason?: string) {
    const guest = await this.prisma.guest.findFirst({ where: { id, propertyId } });
    if (!guest) throw new NotFoundException('Guest not found');
    return this.prisma.guest.update({
      where: { id },
      data: {
        blacklisted: !guest.blacklisted,
        notes: reason ? `BLACKLISTED: ${reason}\n${guest.notes ?? ''}` : guest.notes,
      },
    });
  }

  async merge(primaryId: string, duplicateId: string, propertyId: string) {
    const [primary, duplicate] = await Promise.all([
      this.prisma.guest.findFirst({ where: { id: primaryId, propertyId } }),
      this.prisma.guest.findFirst({ where: { id: duplicateId, propertyId } }),
    ]);
    if (!primary || !duplicate) throw new NotFoundException('Guest not found');

    // Move all reservations to primary
    await this.prisma.reservation.updateMany({
      where: { guestId: duplicateId },
      data: { guestId: primaryId },
    });

    // Update stats on primary
    await this.prisma.guest.update({
      where: { id: primaryId },
      data: {
        totalStays: { increment: duplicate.totalStays },
        totalRevenue: { increment: duplicate.totalRevenue },
      },
    });

    // Delete duplicate
    await this.prisma.guest.delete({ where: { id: duplicateId } });

    return this.findOne(primaryId, propertyId);
  }

  async getStats(propertyId: string) {
    const [total, vip, returning, newThisMonth] = await Promise.all([
      this.prisma.guest.count({ where: { propertyId } }),
      this.prisma.guest.count({ where: { propertyId, vip: true } }),
      this.prisma.guest.count({ where: { propertyId, totalStays: { gt: 1 } } }),
      this.prisma.guest.count({
        where: {
          propertyId,
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
    ]);

    const topGuests = await this.prisma.guest.findMany({
      where: { propertyId },
      orderBy: { totalRevenue: 'desc' },
      take: 5,
    });

    return { total, vip, returning, newThisMonth, topGuests };
  }
}
