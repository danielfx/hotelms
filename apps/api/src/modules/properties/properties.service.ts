import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePropertyDto, UpdatePropertySettingsDto } from './dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findOne(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { _count: { select: { rooms: true, guests: true, reservations: true, users: true } } },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(propertyId: string, dto: UpdatePropertyDto) {
    return this.prisma.property.update({ where: { id: propertyId }, data: dto });
  }

  async updateSettings(propertyId: string, dto: UpdatePropertySettingsDto) {
    return this.prisma.property.update({ where: { id: propertyId }, data: dto });
  }

  async getStats(propertyId: string) {
    const [totalRooms, totalGuests, totalReservations, activeChannels, totalRevenue] = await Promise.all([
      this.prisma.room.count({ where: { propertyId } }),
      this.prisma.guest.count({ where: { propertyId } }),
      this.prisma.reservation.count({ where: { propertyId } }),
      this.prisma.channelConnection.count({ where: { propertyId, status: 'ACTIVE' } }),
      this.prisma.payment.aggregate({ where: { propertyId, status: 'CAPTURED' }, _sum: { amount: true } }),
    ]);
    return { totalRooms, totalGuests, totalReservations, activeChannels, totalRevenue: Number(totalRevenue._sum.amount || 0) };
  }

  async listAll() {
    return this.prisma.property.findMany({
      where: { isActive: true },
      include: { _count: { select: { rooms: true, reservations: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
