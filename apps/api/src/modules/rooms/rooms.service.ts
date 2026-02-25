import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoomStatus, Prisma } from '@prisma/client';
import { CreateRoomDto, UpdateRoomDto, UpdateRoomStatusDto, RoomFilterDto, CreateRoomTypeDto } from './dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  // ─── ROOM TYPES ────────────────────────────────────────────────────────────

  async findAllTypes(propertyId: string) {
    return this.prisma.roomType.findMany({
      where: { propertyId, isActive: true },
      include: { _count: { select: { rooms: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createType(propertyId: string, dto: CreateRoomTypeDto) {
    const exists = await this.prisma.roomType.findUnique({
      where: { propertyId_code: { propertyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Room type with code ${dto.code} already exists`);

    return this.prisma.roomType.create({
      data: { ...dto, propertyId, code: dto.code.toUpperCase() },
    });
  }

  async updateType(id: string, propertyId: string, data: Partial<CreateRoomTypeDto>) {
    const type = await this.prisma.roomType.findFirst({ where: { id, propertyId } });
    if (!type) throw new NotFoundException('Room type not found');
    return this.prisma.roomType.update({ where: { id }, data });
  }

  async deleteType(id: string, propertyId: string) {
    const rooms = await this.prisma.room.count({ where: { roomTypeId: id } });
    if (rooms > 0) throw new BadRequestException('Cannot delete room type with existing rooms. Deactivate it instead.');
    await this.prisma.roomType.delete({ where: { id } });
    return { message: 'Room type deleted' };
  }

  // ─── ROOMS ────────────────────────────────────────────────────────────────

  async findAll(propertyId: string, filter: RoomFilterDto) {
    const where: Prisma.RoomWhereInput = { propertyId };
    if (filter.status) where.status = filter.status as RoomStatus;
    if (filter.floor) where.floor = Number(filter.floor);
    if (filter.roomTypeId) where.roomTypeId = filter.roomTypeId;

    const rooms = await this.prisma.room.findMany({
      where,
      include: {
        roomType: true,
        reservations: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] } },
          include: { guest: { select: { firstName: true, lastName: true } } },
          orderBy: { checkIn: 'asc' },
          take: 3,
        },
        hkTasks: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    });

    // Group by floor
    const byFloor = rooms.reduce((acc, room) => {
      const floor = room.floor;
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(room);
      return acc;
    }, {} as Record<number, typeof rooms>);

    return {
      rooms,
      byFloor,
      stats: {
        total: rooms.length,
        available: rooms.filter(r => r.status === 'AVAILABLE').length,
        occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
        cleaning: rooms.filter(r => r.status === 'CLEANING').length,
        maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
        reserved: rooms.filter(r => r.status === 'RESERVED').length,
        outOfOrder: rooms.filter(r => r.status === 'OUT_OF_ORDER').length,
      },
    };
  }

  async findOne(id: string, propertyId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id, propertyId },
      include: {
        roomType: true,
        reservations: {
          where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
          include: { guest: true },
          orderBy: { checkIn: 'desc' },
          take: 10,
        },
        hkTasks: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        maintenanceLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async create(propertyId: string, dto: CreateRoomDto) {
    const exists = await this.prisma.room.findUnique({
      where: { propertyId_number: { propertyId, number: dto.number } },
    });
    if (exists) throw new ConflictException(`Room number ${dto.number} already exists`);

    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, propertyId },
    });
    if (!roomType) throw new NotFoundException('Room type not found');

    return this.prisma.room.create({
      data: { ...dto, propertyId },
      include: { roomType: true },
    });
  }

  async update(id: string, propertyId: string, dto: UpdateRoomDto) {
    const room = await this.prisma.room.findFirst({ where: { id, propertyId } });
    if (!room) throw new NotFoundException('Room not found');

    if (dto.number && dto.number !== room.number) {
      const exists = await this.prisma.room.findUnique({
        where: { propertyId_number: { propertyId, number: dto.number } },
      });
      if (exists) throw new ConflictException(`Room number ${dto.number} already exists`);
    }

    return this.prisma.room.update({
      where: { id },
      data: dto,
      include: { roomType: true },
    });
  }

  async updateStatus(id: string, propertyId: string, dto: UpdateRoomStatusDto, userId: string) {
    const room = await this.prisma.room.findFirst({ where: { id, propertyId } });
    if (!room) throw new NotFoundException('Room not found');

    // Business rules
    if (room.status === 'OCCUPIED' && dto.status === 'AVAILABLE') {
      throw new BadRequestException('Cannot set occupied room to available directly. Check out the guest first.');
    }

    const updated = await this.prisma.room.update({
      where: { id },
      data: {
        status: dto.status as RoomStatus,
        notes: dto.notes ?? room.notes,
        lastCleanedAt: dto.status === 'AVAILABLE' ? new Date() : room.lastCleanedAt,
      },
      include: { roomType: true },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        propertyId,
        userId,
        action: 'ROOM_STATUS_CHANGE',
        resource: 'Room',
        resourceId: id,
        oldValues: { status: room.status },
        newValues: { status: dto.status },
      },
    });

    // Auto-create housekeeping task when checking out
    if (dto.status === 'CLEANING') {
      await this.prisma.housekeepingTask.create({
        data: {
          propertyId,
          roomId: id,
          type: 'CHECKOUT_CLEANING',
          status: 'PENDING',
          priority: 'HIGH',
        },
      });
    }

    return updated;
  }

  async delete(id: string, propertyId: string) {
    const room = await this.prisma.room.findFirst({ where: { id, propertyId } });
    if (!room) throw new NotFoundException('Room not found');

    if (room.status === 'OCCUPIED') {
      throw new BadRequestException('Cannot delete an occupied room');
    }

    const activeReservations = await this.prisma.reservation.count({
      where: { roomId: id, status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] } },
    });
    if (activeReservations > 0) {
      throw new BadRequestException('Cannot delete room with active reservations');
    }

    await this.prisma.room.delete({ where: { id } });
    return { message: 'Room deleted successfully' };
  }

  // ─── AVAILABILITY ─────────────────────────────────────────────────────────

  async getAvailability(propertyId: string, checkIn: string, checkOut: string, roomTypeId?: string) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    // Get all rooms for property
    const where: Prisma.RoomWhereInput = {
      propertyId,
      status: { notIn: ['OUT_OF_ORDER', 'MAINTENANCE'] },
    };
    if (roomTypeId) where.roomTypeId = roomTypeId;

    const allRooms = await this.prisma.room.findMany({
      where,
      include: { roomType: true },
    });

    // Find booked room IDs for the date range
    const bookedRooms = await this.prisma.reservation.findMany({
      where: {
        propertyId,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
        AND: [
          { checkIn: { lt: checkOutDate } },
          { checkOut: { gt: checkInDate } },
        ],
      },
      select: { roomId: true },
    });

    const bookedRoomIds = new Set(bookedRooms.map(r => r.roomId));

    // Mark availability
    const rooms = allRooms.map(room => ({
      ...room,
      isAvailable: !bookedRoomIds.has(room.id) && room.status === 'AVAILABLE',
    }));

    // Group by room type
    const byType = rooms.reduce((acc, room) => {
      const typeId = room.roomTypeId;
      if (!acc[typeId]) {
        acc[typeId] = {
          roomType: room.roomType,
          available: 0,
          total: 0,
          rooms: [],
        };
      }
      acc[typeId].total++;
      if (room.isAvailable) acc[typeId].available++;
      acc[typeId].rooms.push(room);
      return acc;
    }, {} as Record<string, any>);

    return {
      checkIn,
      checkOut,
      nights: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000),
      rooms,
      byType: Object.values(byType),
      totalAvailable: rooms.filter(r => r.isAvailable).length,
    };
  }

  // ─── BULK OPERATIONS ──────────────────────────────────────────────────────

  async bulkCreate(propertyId: string, rooms: CreateRoomDto[]) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const dto of rooms) {
      try {
        await this.create(propertyId, dto);
        results.created++;
      } catch (e: any) {
        results.skipped++;
        results.errors.push(`Room ${dto.number}: ${e.message}`);
      }
    }

    return results;
  }

  async getOccupancyStats(propertyId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    const rooms = await this.prisma.room.findMany({ where: { propertyId } });
    const occupied = await this.prisma.reservation.count({
      where: {
        propertyId,
        status: 'CHECKED_IN',
        checkIn: { lte: new Date(dateStr) },
        checkOut: { gt: new Date(dateStr) },
      },
    });

    return {
      date: dateStr,
      total: rooms.length,
      occupied,
      available: rooms.filter(r => r.status === 'AVAILABLE').length,
      cleaning: rooms.filter(r => r.status === 'CLEANING').length,
      maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
      outOfOrder: rooms.filter(r => r.status === 'OUT_OF_ORDER').length,
      occupancyRate: rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0,
    };
  }
}
