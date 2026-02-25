import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ReservationStatus, RoomStatus, BookingSource } from '@prisma/client';
import {
  CreateReservationDto, UpdateReservationDto, CheckInDto,
  CheckOutDto, CancelReservationDto, ReservationFilterDto
} from './dto';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── LIST ─────────────────────────────────────────────────────────────────

  async findAll(propertyId: string, filter: ReservationFilterDto) {
    const where: Prisma.ReservationWhereInput = { propertyId };
    const page = Number(filter.page ?? 1);
    const limit = Number(filter.limit ?? 20);

    if (filter.status) where.status = filter.status as ReservationStatus;
    if (filter.source) where.source = filter.source as BookingSource;
    if (filter.roomId) where.roomId = filter.roomId;
    if (filter.guestId) where.guestId = filter.guestId;

    // Date filters
    if (filter.date) {
      const d = new Date(filter.date);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      where.AND = [
        { checkIn: { lte: next } },
        { checkOut: { gt: d } },
      ];
    }
    if (filter.checkIn) where.checkIn = { gte: new Date(filter.checkIn) };
    if (filter.checkOut) where.checkOut = { lte: new Date(filter.checkOut) };

    // Search
    if (filter.q) {
      where.OR = [
        { confirmationNo: { contains: filter.q, mode: 'insensitive' } },
        { guest: { firstName: { contains: filter.q, mode: 'insensitive' } } },
        { guest: { lastName: { contains: filter.q, mode: 'insensitive' } } },
        { guest: { email: { contains: filter.q, mode: 'insensitive' } } },
        { room: { number: { contains: filter.q } } },
      ];
    }

    const orderBy: Prisma.ReservationOrderByWithRelationInput =
      filter.sortBy === 'checkIn' ? { checkIn: (filter.sortDir as any) ?? 'asc' }
      : filter.sortBy === 'total' ? { totalAmount: (filter.sortDir as any) ?? 'desc' }
      : { createdAt: 'desc' };

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        include: {
          guest: true,
          room: { include: { roomType: true } },
          ratePlan: { select: { name: true, code: true, mealPlan: true } },
          folio: { select: { id: true, status: true, balance: true, totalCharges: true } },
          payments: { select: { id: true, amount: true, method: true, status: true } },
          _count: { select: { guestMessages: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      reservations,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  // ─── ARRIVALS / DEPARTURES ────────────────────────────────────────────────

  async getArrivals(propertyId: string, date: string) {
    const d = new Date(date);
    return this.prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: { gte: d, lt: new Date(d.getTime() + 86400000) },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: { guest: true, room: { include: { roomType: true } }, folio: true },
      orderBy: { eta: 'asc' },
    });
  }

  async getDepartures(propertyId: string, date: string) {
    const d = new Date(date);
    return this.prisma.reservation.findMany({
      where: {
        propertyId,
        checkOut: { gte: d, lt: new Date(d.getTime() + 86400000) },
        status: 'CHECKED_IN',
      },
      include: { guest: true, room: { include: { roomType: true } }, folio: true },
      orderBy: { checkOut: 'asc' },
    });
  }

  async getInHouse(propertyId: string) {
    return this.prisma.reservation.findMany({
      where: { propertyId, status: 'CHECKED_IN' },
      include: { guest: true, room: { include: { roomType: true } }, folio: true },
      orderBy: { checkOut: 'asc' },
    });
  }

  // ─── FIND ONE ─────────────────────────────────────────────────────────────

  async findOne(id: string, propertyId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { OR: [{ id }, { confirmationNo: id }], propertyId },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        ratePlan: true,
        folio: {
          include: {
            charges: { where: { voided: false }, orderBy: { date: 'asc' } },
          },
        },
        payments: { orderBy: { createdAt: 'desc' } },
        guestMessages: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(propertyId: string, dto: CreateReservationDto, userId: string) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkIn >= checkOut) throw new BadRequestException('Check-out must be after check-in');
    if (checkIn < new Date(new Date().toDateString())) {
      // Allow past dates for walk-ins / manual entries
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);

    // Verify room exists
    const room = await this.prisma.room.findFirst({
      where: { id: dto.roomId, propertyId },
      include: { roomType: true },
    });
    if (!room) throw new NotFoundException('Room not found');

    // Check availability — no double bookings ever
    const conflict = await this.prisma.reservation.findFirst({
      where: {
        roomId: dto.roomId,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
        ],
      },
    });
    if (conflict) {
      throw new ConflictException(
        `Room ${room.number} is already booked from ${conflict.checkIn.toISOString().split('T')[0]} to ${conflict.checkOut.getTime().toString()}`
      );
    }

    // Resolve or create guest
    let guestId = dto.guestId;
    if (!guestId && dto.guestData) {
      const guest = await this.prisma.guest.create({
        data: { propertyId, ...dto.guestData },
      });
      guestId = guest.id;
    }
    if (!guestId) throw new BadRequestException('guestId or guestData is required');

    // Verify guest belongs to property
    const guest = await this.prisma.guest.findFirst({ where: { id: guestId, propertyId } });
    if (!guest) throw new NotFoundException('Guest not found');

    // Get property for tax rates
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });

    // Calculate pricing
    const baseRate = dto.rateOverride ?? Number(room.roomType.basePrice);
    const totalRoomCharge = baseRate * nights;
    const taxRate = property?.taxRate ?? 0;
    const totalTax = totalRoomCharge * (taxRate / 100);
    const resortFee = (property?.resortFee ?? 0) * nights;
    const totalFees = resortFee;
    const totalAmount = totalRoomCharge + totalTax + totalFees;
    const commissionPct = dto.commissionPct ?? 0;
    const commission = totalAmount * (commissionPct / 100);

    const reservation = await this.prisma.reservation.create({
      data: {
        propertyId,
        roomId: dto.roomId,
        guestId,
        ratePlanId: dto.ratePlanId,
        source: (dto.source ?? 'DIRECT') as BookingSource,
        channelId: dto.channelId,
        externalId: dto.externalId,
        status: 'CONFIRMED',
        checkIn,
        checkOut,
        nights,
        adults: dto.adults ?? 1,
        children: dto.children ?? 0,
        infants: dto.infants ?? 0,
        baseRate,
        totalRoomCharge,
        totalTax,
        totalFees,
        totalAmount,
        paidAmount: 0,
        balanceDue: totalAmount,
        commissionPct,
        commission,
        currency: property?.currency ?? 'USD',
        notes: dto.notes,
        specialRequests: dto.specialRequests,
        eta: dto.eta,
        // Create folio inline
        folio: {
          create: {
            propertyId,
            totalCharges: totalAmount,
            totalPayments: 0,
            totalTax,
            balance: totalAmount,
            charges: {
              create: [
                {
                  type: 'ROOM',
                  description: `Room ${room.number} - ${room.roomType.name} (${nights} night${nights > 1 ? 's' : ''})`,
                  quantity: nights,
                  unitPrice: baseRate,
                  amount: totalRoomCharge,
                  taxRate,
                  taxAmount: totalTax,
                  date: checkIn,
                },
                ...(resortFee > 0 ? [{
                  type: 'RESORT_FEE' as any,
                  description: 'Resort Fee',
                  quantity: nights,
                  unitPrice: property!.resortFee,
                  amount: resortFee,
                  taxRate: 0,
                  taxAmount: 0,
                }] : []),
              ],
            },
          },
        },
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        folio: { include: { charges: true } },
      },
    });

    // Update room status to RESERVED
    await this.prisma.room.update({
      where: { id: dto.roomId },
      data: { status: RoomStatus.RESERVED },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        propertyId,
        userId,
        action: 'RESERVATION_CREATED',
        resource: 'Reservation',
        resourceId: reservation.id,
        newValues: { confirmationNo: reservation.confirmationNo, totalAmount, nights },
      },
    });

    this.logger.log(`Reservation ${reservation.confirmationNo} created for ${guest.firstName} ${guest.lastName}`);
    return reservation;
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(id: string, propertyId: string, dto: UpdateReservationDto, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, propertyId },
      include: { room: { include: { roomType: true } } },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(reservation.status)) {
      throw new BadRequestException(`Cannot modify a ${reservation.status} reservation`);
    }

    const oldValues = { ...reservation };

    // Recalculate if dates or room changed
    let updateData: Prisma.ReservationUncheckedUpdateInput = {
      notes: dto.notes,
      specialRequests: dto.specialRequests,
      internalNotes: dto.internalNotes,
      eta: dto.eta,
    };

    if (dto.checkIn || dto.checkOut || dto.roomId || dto.rateOverride) {
      const checkIn = dto.checkIn ? new Date(dto.checkIn) : reservation.checkIn;
      const checkOut = dto.checkOut ? new Date(dto.checkOut) : reservation.checkOut;
      const roomId = dto.roomId ?? reservation.roomId;
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);

      // Check availability if room or dates changed
      if (dto.roomId || dto.checkIn || dto.checkOut) {
        const conflict = await this.prisma.reservation.findFirst({
          where: {
            roomId,
            id: { not: id },
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
            AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
          },
        });
        if (conflict) throw new ConflictException('Room is not available for these dates');
      }

      const room = dto.roomId
        ? await this.prisma.room.findFirst({ where: { id: roomId, propertyId }, include: { roomType: true } })
        : reservation.room;
      if (!room) throw new NotFoundException('Room not found');

      const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
      const baseRate = dto.rateOverride ?? Number(room.roomType.basePrice);
      const totalRoomCharge = baseRate * nights;
      const taxRate = property?.taxRate ?? 0;
      const totalTax = totalRoomCharge * (taxRate / 100);
      const totalFees = (property?.resortFee ?? 0) * nights;
      const totalAmount = totalRoomCharge + totalTax + totalFees;

      updateData = {
        ...updateData,
        roomId,
        checkIn,
        checkOut,
        nights,
        baseRate,
        totalRoomCharge,
        totalTax,
        totalFees,
        totalAmount,
        balanceDue: totalAmount - Number(reservation.paidAmount),
      };
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: updateData,
      include: { guest: true, room: { include: { roomType: true } }, folio: true },
    });

    await this.prisma.auditLog.create({
      data: {
        propertyId, userId,
        action: 'RESERVATION_MODIFIED',
        resource: 'Reservation', resourceId: id,
        oldValues: oldValues as any, newValues: updateData as any,
      },
    });

    return updated;
  }

  // ─── CHECK-IN ─────────────────────────────────────────────────────────────

  async checkIn(id: string, propertyId: string, dto: CheckInDto, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, propertyId },
      include: { guest: true, room: true, folio: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status === 'CHECKED_IN') throw new BadRequestException('Guest is already checked in');
    if (!['CONFIRMED', 'PENDING'].includes(reservation.status)) {
      throw new BadRequestException(`Cannot check in a ${reservation.status} reservation`);
    }

    const roomId = dto.roomId ?? reservation.roomId;

    // Verify room is ready
    const room = await this.prisma.room.findFirst({ where: { id: roomId, propertyId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.status === 'CLEANING') throw new BadRequestException('Room is still being cleaned');
    if (room.status === 'MAINTENANCE') throw new BadRequestException('Room is under maintenance');
    if (room.status === 'OUT_OF_ORDER') throw new BadRequestException('Room is out of order');

    // Update passport if provided
    if (dto.passportNo) {
      await this.prisma.guest.update({
        where: { id: reservation.guestId },
        data: { passportNo: dto.passportNo },
      });
    }

    // Perform check-in
    const [updatedReservation] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: new Date(),
          roomId,
          internalNotes: dto.notes
            ? `${reservation.internalNotes ?? ''}\nCheck-in: ${dto.notes}`.trim()
            : reservation.internalNotes,
        },
        include: { guest: true, room: { include: { roomType: true } }, folio: true },
      }),
      this.prisma.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.OCCUPIED },
      }),
      this.prisma.guest.update({
        where: { id: reservation.guestId },
        data: { totalStays: { increment: 1 } },
      }),
      this.prisma.auditLog.create({
        data: {
          propertyId, userId,
          action: 'GUEST_CHECKED_IN',
          resource: 'Reservation', resourceId: id,
          newValues: { checkedInAt: new Date(), roomId },
        },
      }),
    ]);

    // Schedule auto-post of room charges if not already done
    this.logger.log(`Guest ${reservation.guest.firstName} ${reservation.guest.lastName} checked into Room ${room.number}`);
    return updatedReservation;
  }

  // ─── CHECK-OUT ────────────────────────────────────────────────────────────

  async checkOut(id: string, propertyId: string, dto: CheckOutDto, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, propertyId },
      include: { guest: true, room: true, folio: { include: { charges: true } } },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== 'CHECKED_IN') {
      throw new BadRequestException('Guest is not currently checked in');
    }
    if (!reservation.folio) throw new BadRequestException('No folio found for this reservation');

    // Check for outstanding balance
    const balance = Number(reservation.folio.balance);
    if (balance > 0.01) {
      throw new BadRequestException(
        `Outstanding balance of $${balance.toFixed(2)}. Please settle the folio before check-out.`
      );
    }

    const checkOutDate = dto.checkOutDate ? new Date(dto.checkOutDate) : new Date();

    const [updatedReservation] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: {
          status: 'CHECKED_OUT',
          checkedOutAt: checkOutDate,
        },
        include: { guest: true, room: { include: { roomType: true } }, folio: true },
      }),
      this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: RoomStatus.CLEANING },
      }),
      this.prisma.folio.update({
        where: { id: reservation.folio.id },
        data: { status: 'CLOSED', closedAt: new Date() },
      }),
      this.prisma.guest.update({
        where: { id: reservation.guestId },
        data: { totalRevenue: { increment: Number(reservation.totalAmount) } },
      }),
      // Create housekeeping task
      this.prisma.housekeepingTask.create({
        data: {
          propertyId,
          roomId: reservation.roomId,
          type: 'CHECKOUT_CLEANING',
          status: 'PENDING',
          priority: 'HIGH',
        },
      }),
      this.prisma.auditLog.create({
        data: {
          propertyId, userId,
          action: 'GUEST_CHECKED_OUT',
          resource: 'Reservation', resourceId: id,
          newValues: { checkedOutAt: checkOutDate },
        },
      }),
    ]);

    this.logger.log(`Guest ${reservation.guest.firstName} ${reservation.guest.lastName} checked out from Room ${reservation.room.number}`);
    return updatedReservation;
  }

  // ─── CANCEL ───────────────────────────────────────────────────────────────

  async cancel(id: string, propertyId: string, dto: CancelReservationDto, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, propertyId },
      include: { room: true, ratePlan: true, folio: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (['CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].includes(reservation.status)) {
      throw new BadRequestException(`Cannot cancel a ${reservation.status} reservation`);
    }

    const ops: any[] = [
      this.prisma.reservation.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: dto.reason,
        },
      }),
      this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: RoomStatus.AVAILABLE },
      }),
      this.prisma.auditLog.create({
        data: {
          propertyId, userId,
          action: 'RESERVATION_CANCELLED',
          resource: 'Reservation', resourceId: id,
          newValues: { reason: dto.reason, cancelledAt: new Date() },
        },
      }),
    ];

    // Apply cancellation fee if required
    if (dto.applyFee && reservation.folio && reservation.ratePlan) {
      const hoursUntilCheckIn = (reservation.checkIn.getTime() - Date.now()) / 3600000;
      const cancellationHours = reservation.ratePlan.cancellationHours;
      if (hoursUntilCheckIn < cancellationHours) {
        const feeAmount = Number(reservation.totalAmount) * (reservation.ratePlan.cancellationPct / 100);
        ops.push(
          this.prisma.folioCharge.create({
            data: {
              folioId: reservation.folio.id,
              type: 'OTHER' as any,
              description: 'Cancellation Fee',
              quantity: 1,
              unitPrice: feeAmount,
              amount: feeAmount,
              taxRate: 0,
              taxAmount: 0,
            },
          })
        );
      }
    }

    await this.prisma.$transaction(ops);
    return { message: 'Reservation cancelled successfully' };
  }

  // ─── NO SHOW ──────────────────────────────────────────────────────────────

  async markNoShow(id: string, propertyId: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, propertyId, status: { in: ['CONFIRMED', 'PENDING'] } },
      include: { room: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found or already processed');

    await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: { status: 'NO_SHOW', noShowAt: new Date() },
      }),
      this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: RoomStatus.AVAILABLE },
      }),
      this.prisma.auditLog.create({
        data: {
          propertyId, userId,
          action: 'RESERVATION_NO_SHOW',
          resource: 'Reservation', resourceId: id,
          newValues: { noShowAt: new Date() },
        },
      }),
    ]);

    return { message: 'Reservation marked as no-show' };
  }

  // ─── DASHBOARD STATS ──────────────────────────────────────────────────────

  async getDashboardStats(propertyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      arrivalsToday, departuresToday, inHouse,
      totalRooms, monthRevenue, pendingReservations,
      sourceBreakdown
    ] = await Promise.all([
      this.prisma.reservation.count({
        where: { propertyId, checkIn: { gte: today, lt: tomorrow }, status: { in: ['CONFIRMED', 'PENDING'] } },
      }),
      this.prisma.reservation.count({
        where: { propertyId, checkOut: { gte: today, lt: tomorrow }, status: 'CHECKED_IN' },
      }),
      this.prisma.reservation.count({ where: { propertyId, status: 'CHECKED_IN' } }),
      this.prisma.room.count({ where: { propertyId } }),
      this.prisma.reservation.aggregate({
        where: {
          propertyId, status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          createdAt: { gte: monthStart },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.reservation.count({
        where: { propertyId, status: 'PENDING' },
      }),
      this.prisma.reservation.groupBy({
        by: ['source'],
        where: { propertyId, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        _count: true,
        _sum: { totalAmount: true },
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round((inHouse / totalRooms) * 100) : 0;

    // Next 7 days occupancy forecast
    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const next = new Date(date); next.setDate(date.getDate() + 1);
      const count = await this.prisma.reservation.count({
        where: {
          propertyId,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
          AND: [{ checkIn: { lt: next } }, { checkOut: { gt: date } }],
        },
      });
      forecast.push({
        date: date.toISOString().split('T')[0],
        occupied: count,
        occupancyRate: totalRooms > 0 ? Math.round((count / totalRooms) * 100) : 0,
      });
    }

    return {
      arrivalsToday,
      departuresToday,
      inHouse,
      totalRooms,
      occupancyRate,
      pendingReservations,
      monthRevenue: Number(monthRevenue._sum.totalAmount ?? 0),
      sourceBreakdown,
      forecast,
    };
  }
}
