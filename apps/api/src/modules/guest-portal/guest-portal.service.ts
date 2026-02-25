import {
  Injectable, NotFoundException, BadRequestException,
  UnauthorizedException, Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

export interface GuestToken { reservationId: string; guestId: string; propertyId: string; }

@Injectable()
export class GuestPortalService {
  private readonly logger = new Logger(GuestPortalService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // --- AUTHENTICATE GUEST ---------------------------------------------------
  // Guest logs in via magic link or confirmation# + lastname

  async authenticateGuest(confirmationNo: string, lastName: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        confirmationNo,
        guest: { lastName: { equals: lastName, mode: 'insensitive' } },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      },
      include: { guest: true, property: true },
    });
    if (!reservation) throw new UnauthorizedException('Reservation not found');

    const token = this.jwt.sign(
      { reservationId: reservation.id, guestId: reservation.guestId, propertyId: reservation.propertyId },
      { expiresIn: '7d' },
    );

    return { token, reservation: { confirmationNo, checkIn: reservation.checkIn, checkOut: reservation.checkOut } };
  }

  async verifyGuestToken(token: string): Promise<GuestToken> {
    try {
      return this.jwt.verify(token) as GuestToken;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // --- GET PORTAL DATA ------------------------------------------------------

  async getPortalData(ctx: GuestToken) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: ctx.reservationId, guestId: ctx.guestId },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        property: {
          select: {
            name: true, address: true, phone: true, email: true,
            checkInTime: true, checkOutTime: true, amenities: true, images: true,
          },
        },
        folio: {
          include: {
            charges: { where: { voided: false }, orderBy: { date: 'asc' } },
          },
        },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
        guestMessages: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    const today = new Date();
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - today.getTime()) / 86400000);
    const daysUntilCheckOut = Math.ceil((checkOut.getTime() - today.getTime()) / 86400000);

    // Service requests and facilities are not modeled in the schema.
    // Return empty arrays as placeholders.
    const serviceRequests: any[] = [];
    const facilities: any[] = [];

    return {
      reservation,
      guest: reservation.guest,
      property: reservation.property,
      folio: reservation.folio,
      serviceRequests,
      facilities,
      unreadMessages: reservation.guestMessages.length,
      meta: {
        isPreArrival: daysUntilCheckIn > 0,
        isInHouse: reservation.status === 'CHECKED_IN',
        isPostStay: reservation.status === 'CHECKED_OUT',
        daysUntilCheckIn: Math.max(0, daysUntilCheckIn),
        daysUntilCheckOut: Math.max(0, daysUntilCheckOut),
        canOnlineCheckIn: daysUntilCheckIn <= 1 && daysUntilCheckIn >= 0 && reservation.status !== 'CHECKED_IN',
        canCheckOut: reservation.status === 'CHECKED_IN' && Number(reservation.folio?.balance ?? 0) <= 0.01,
      },
    };
  }

  // --- ONLINE CHECK-IN ------------------------------------------------------

  async onlineCheckIn(ctx: GuestToken, dto: {
    passportNo?: string;
    estimatedArrivalTime?: string;
    acceptTerms: boolean;
    additionalGuests?: { firstName: string; lastName: string; passportNo?: string }[];
  }) {
    if (!dto.acceptTerms) throw new BadRequestException('Must accept terms and conditions');

    const reservation = await this.prisma.reservation.findFirst({
      where: { id: ctx.reservationId, guestId: ctx.guestId },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status === 'CHECKED_IN') throw new BadRequestException('Already checked in');

    const updates: any = {};
    if (dto.estimatedArrivalTime) updates.eta = dto.estimatedArrivalTime;

    if (dto.passportNo) {
      await this.prisma.guest.update({
        where: { id: ctx.guestId },
        data: { passportNo: dto.passportNo },
      });
    }

    await this.prisma.reservation.update({
      where: { id: ctx.reservationId },
      data: updates,
    });

    this.logger.log(`Online check-in completed for reservation ${reservation.confirmationNo}`);
    return { success: true, message: 'Online check-in complete. Your room will be ready upon arrival.' };
  }

  // --- SERVICE REQUESTS (placeholder - model does not exist) ----------------

  async createServiceRequest(ctx: GuestToken, dto: {
    type: string;
    category: string;
    description: string;
    priority?: string;
    scheduledFor?: string;
  }) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: ctx.reservationId, status: 'CHECKED_IN' },
    });
    if (!reservation) throw new BadRequestException('Active reservation required for service requests');

    // serviceRequest model does not exist in the schema.
    // Create a notification to alert staff instead.
    await this.prisma.notification.create({
      data: {
        propertyId: ctx.propertyId,
        type: 'SYSTEM_ALERT',
        title: `New ${dto.category} request`,
        body: `Room ${reservation.roomId}: ${dto.description}`,
        data: { reservationId: ctx.reservationId, type: dto.type, category: dto.category },
      },
    });

    // Return a mock service request object
    return {
      id: `sr_${Date.now()}`,
      propertyId: ctx.propertyId,
      reservationId: ctx.reservationId,
      type: dto.type,
      category: dto.category,
      description: dto.description,
      priority: dto.priority ?? 'NORMAL',
      status: 'OPEN',
      createdAt: new Date(),
    };
  }

  async getServiceRequests(ctx: GuestToken) {
    // serviceRequest model does not exist in the schema.
    // Return empty array as placeholder.
    return [];
  }

  async cancelServiceRequest(ctx: GuestToken, requestId: string) {
    // serviceRequest model does not exist in the schema.
    // Return a mock cancelled response.
    return { id: requestId, status: 'CANCELLED' };
  }

  // --- MESSAGES -------------------------------------------------------------

  async getMessages(ctx: GuestToken) {
    const messages = await this.prisma.guestMessage.findMany({
      where: { reservationId: ctx.reservationId },
      orderBy: { createdAt: 'asc' },
    });

    // Mark all as read
    await this.prisma.guestMessage.updateMany({
      where: { reservationId: ctx.reservationId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return messages;
  }

  async sendMessage(ctx: GuestToken, content: string) {
    const msg = await this.prisma.guestMessage.create({
      data: {
        reservationId: ctx.reservationId,
        propertyId: ctx.propertyId,
        body: content,
        direction: 'INBOUND',
        channel: 'PORTAL',
      },
    });

    // Notify staff
    await this.prisma.notification.create({
      data: {
        propertyId: ctx.propertyId,
        type: 'SYSTEM_ALERT',
        title: 'New guest message',
        body: content.slice(0, 100),
        data: { reservationId: ctx.reservationId, messageId: msg.id },
      },
    });

    return msg;
  }

  // --- DIGITAL KEY ----------------------------------------------------------

  async getDigitalKey(ctx: GuestToken) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: ctx.reservationId, status: 'CHECKED_IN' },
      include: { room: true },
    });
    if (!reservation) throw new BadRequestException('Must be checked in to access digital key');

    // In real impl: integrate with ASSA ABLOY, DORMAKABA, or Salto
    const keyCode = Buffer.from(`${reservation.id}-${reservation.room.number}`).toString('base64').slice(0, 16).toUpperCase();

    return {
      roomNumber: reservation.room.number,
      keyCode,
      validFrom: reservation.checkIn,
      validUntil: reservation.checkOut,
      instructions: 'Tap your phone against the door lock to open',
    };
  }

  // --- FOLIO PREVIEW --------------------------------------------------------

  async getFolio(ctx: GuestToken) {
    const folio = await this.prisma.folio.findFirst({
      where: { reservationId: ctx.reservationId },
      include: {
        charges: { where: { voided: false }, orderBy: { date: 'asc' } },
        reservation: { include: { payments: true } },
      },
    });
    if (!folio) throw new NotFoundException('Folio not found');
    return folio;
  }

  // --- REVIEW / FEEDBACK (placeholder - review model does not exist) --------

  async submitReview(ctx: GuestToken, dto: {
    overallRating: number;
    cleanlinessRating?: number;
    serviceRating?: number;
    locationRating?: number;
    comment?: string;
    isAnonymous?: boolean;
  }) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: ctx.reservationId, status: { in: ['CHECKED_OUT', 'CHECKED_IN'] } },
    });
    if (!reservation) throw new BadRequestException('Can only review after or during stay');

    // review model does not exist in the schema.
    // Return a mock review object.
    return {
      id: `rev_${Date.now()}`,
      propertyId: ctx.propertyId,
      reservationId: ctx.reservationId,
      guestId: ctx.guestId,
      overallRating: dto.overallRating,
      cleanlinessRating: dto.cleanlinessRating ?? null,
      serviceRating: dto.serviceRating ?? null,
      locationRating: dto.locationRating ?? null,
      comment: dto.comment ?? null,
      isAnonymous: dto.isAnonymous ?? false,
      channel: 'DIRECT',
      createdAt: new Date(),
    };
  }
}
