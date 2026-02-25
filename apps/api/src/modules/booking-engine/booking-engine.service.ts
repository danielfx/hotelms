import {
  Injectable, NotFoundException, BadRequestException,
  ConflictException, Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SearchAvailabilityDto, CreateBookingDto, VerifyPromoDto } from './dto';

@Injectable()
export class BookingEngineService {
  private readonly logger = new Logger(BookingEngineService.name);

  constructor(private prisma: PrismaService) {}

  // ─── GET PROPERTY INFO (public) ──────────────────────────────────────────

  async getPropertyInfo(slug: string) {
    const property = await this.prisma.property.findUnique({
      where: { slug },
      select: {
        id: true, name: true, slug: true, description: true,
        address: true, city: true, country: true,
        phone: true, email: true, website: true,
        starRating: true, checkInTime: true, checkOutTime: true,
        amenities: true, images: true, currency: true,
        taxRate: true, cityTaxRate: true, resortFee: true,
        cancellationPolicy: true, childrenPolicy: true,
        petsPolicy: true, smokingPolicy: true,
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  // ─── SEARCH AVAILABILITY ──────────────────────────────────────────────────

  async searchAvailability(slug: string, dto: SearchAvailabilityDto) {
    const property = await this.prisma.property.findUnique({ where: { slug } });
    if (!property) throw new NotFoundException('Property not found');

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkIn < new Date(new Date().toDateString())) {
      throw new BadRequestException('Check-in cannot be in the past');
    }
    if (checkIn >= checkOut) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
    const adults = dto.adults ?? 1;

    // Get room types with real availability
    const roomTypes = await this.prisma.roomType.findMany({
      where: { propertyId: property.id, isActive: true },
      include: { rooms: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Count booked rooms per type for date range
    const bookedByType: Record<string, number> = {};
    for (const rt of roomTypes) {
      const booked = await this.prisma.reservation.count({
        where: {
          propertyId: property.id,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
          room: { roomTypeId: rt.id },
          AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
        },
      });
      bookedByType[rt.id] = booked;
    }

    // Get public rate plans
    const ratePlans = await this.prisma.ratePlan.findMany({
      where: {
        propertyId: property.id,
        isActive: true,
        availableOnline: true,
        minLOS: { lte: nights },
        OR: [
          { maxLOS: null },
          { maxLOS: { gte: nights } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Verify promo code
    let promoDiscount = 0;
    if (dto.promoCode) {
      // In a real impl: query promo code table
      if (dto.promoCode.toUpperCase() === 'WELCOME10') promoDiscount = 10;
      if (dto.promoCode.toUpperCase() === 'VIP20') promoDiscount = 20;
    }

    const results = [];

    for (const rt of roomTypes) {
      const totalRooms = rt.rooms.filter(r =>
        !['OUT_OF_ORDER', 'MAINTENANCE'].includes(r.status)
      ).length;
      const available = Math.max(0, totalRooms - (bookedByType[rt.id] ?? 0));

      if (available === 0) continue;
      if (rt.capacity < adults) continue; // not enough beds

      const roomRates = [];

      for (const plan of ratePlans) {
        // Get daily rates for this plan + room type
        const dailyRates = await this.prisma.dailyRate.findMany({
          where: {
            ratePlanId: plan.id,
            roomTypeCode: rt.code,
            date: { gte: checkIn, lt: checkOut },
            closed: false,
          },
        });

        // Check LOS restrictions per day
        let hasClosure = false;
        let totalRate = 0;
        const breakdown = [];

        for (let i = 0; i < nights; i++) {
          const date = new Date(checkIn);
          date.setDate(checkIn.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];

          const dr = dailyRates.find(r => r.date.toISOString().split('T')[0] === dateStr);

          if (dr?.closed) { hasClosure = true; break; }
          if (i === 0 && dr?.closedToArrival) { hasClosure = true; break; }
          if (i === nights - 1 && dr?.closedToDeparture) { hasClosure = true; break; }

          let price: number;
          if (dr) {
            price = Number(dr.price);
          } else {
            const base = Number(rt.basePrice);
            price = base * (1 + plan.markup / 100) * (1 - plan.discount / 100);
          }

          // Apply promo
          if (promoDiscount > 0) price *= (1 - promoDiscount / 100);

          totalRate += price;
          breakdown.push({ date: dateStr, price: Math.round(price * 100) / 100 });
        }

        if (hasClosure) continue;

        const taxRate = property.taxRate ?? 0;
        const cityTaxRate = property.cityTaxRate ?? 0;
        const resortFeePerNight = property.resortFee ?? 0;
        const tax = totalRate * (taxRate / 100);
        const cityTax = totalRate * (cityTaxRate / 100);
        const resortFee = Number(resortFeePerNight) * nights;
        const totalAmount = totalRate + tax + cityTax + resortFee;
        const adr = nights > 0 ? totalRate / nights : 0;

        roomRates.push({
          ratePlan: {
            id: plan.id,
            name: plan.name,
            code: plan.code,
            mealPlan: plan.mealPlan,
            cancellationPolicy: plan.cancellationPolicy,
            cancellationHours: plan.cancellationHours,
            isRefundable: plan.isRefundable,
            description: plan.description,
          },
          totalRoomRate: Math.round(totalRate * 100) / 100,
          adr: Math.round(adr * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          cityTax: Math.round(cityTax * 100) / 100,
          resortFee: Math.round(resortFee * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
          breakdown,
          promoApplied: promoDiscount > 0,
          promoDiscount,
        });
      }

      if (roomRates.length === 0) continue;

      // Sort rates cheapest first
      roomRates.sort((a, b) => a.totalAmount - b.totalAmount);

      results.push({
        roomType: {
          id: rt.id,
          code: rt.code,
          name: rt.name,
          description: rt.description,
          capacity: rt.capacity,
          bedType: rt.bedType,
          squareMeters: rt.squareMeters,
          amenities: rt.amenities,
          images: rt.images,
          basePrice: rt.basePrice,
        },
        available,
        rates: roomRates,
        lowestRate: roomRates[0].totalAmount,
        lowestAdr: roomRates[0].adr,
      });
    }

    // Sort by lowest rate
    results.sort((a, b) => a.lowestRate - b.lowestRate);

    return {
      property: {
        name: property.name,
        slug: property.slug,
        checkInTime: property.checkInTime,
        checkOutTime: property.checkOutTime,
        currency: property.currency,
        taxRate: property.taxRate,
        resortFee: property.resortFee,
      },
      search: { checkIn: dto.checkIn, checkOut: dto.checkOut, nights, adults, children: dto.children ?? 0 },
      results,
      totalAvailableTypes: results.length,
      promoApplied: promoDiscount > 0,
      promoDiscount,
    };
  }

  // ─── VERIFY PROMO CODE ────────────────────────────────────────────────────

  async verifyPromo(slug: string, dto: VerifyPromoDto) {
    // Real impl: query promo_codes table with validity + usage limits
    const PROMOS: Record<string, { discount: number; description: string; valid: boolean }> = {
      WELCOME10: { discount: 10, description: '10% off for new guests', valid: true },
      VIP20:     { discount: 20, description: '20% VIP member discount', valid: true },
      SUMMER25:  { discount: 25, description: 'Summer flash sale', valid: false },
    };

    const promo = PROMOS[dto.code.toUpperCase()];
    if (!promo) throw new NotFoundException('Promo code not found');
    if (!promo.valid) throw new BadRequestException('This promo code has expired');

    return { code: dto.code.toUpperCase(), discount: promo.discount, description: promo.description };
  }

  // ─── CREATE BOOKING ───────────────────────────────────────────────────────

  async createBooking(slug: string, dto: CreateBookingDto, paymentService: any) {
    const property = await this.prisma.property.findUnique({ where: { slug } });
    if (!property) throw new NotFoundException('Property not found');

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);

    // Find room type
    const roomType = await this.prisma.roomType.findFirst({
      where: { propertyId: property.id, code: dto.roomTypeCode.toUpperCase() },
      include: {
        rooms: {
          where: { status: { notIn: ['OUT_OF_ORDER', 'MAINTENANCE'] } },
          orderBy: { floor: 'asc' },
        },
      },
    });
    if (!roomType) throw new NotFoundException('Room type not found');

    // Get rate plan
    const ratePlan = await this.prisma.ratePlan.findFirst({
      where: { id: dto.ratePlanId, propertyId: property.id, isActive: true },
    });
    if (!ratePlan) throw new NotFoundException('Rate plan not found');

    // Re-check availability
    for (const room of roomType.rooms) {
      const conflict = await this.prisma.reservation.findFirst({
        where: {
          roomId: room.id,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
          AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
        },
      });
      if (!conflict) {
        // Found available room — proceed with this room
        return this.finalizeBooking(property, room, roomType, ratePlan, dto, nights, paymentService);
      }
    }

    throw new ConflictException('Sorry, this room type is no longer available for the selected dates');
  }

  private async finalizeBooking(property: any, room: any, roomType: any, ratePlan: any, dto: CreateBookingDto, nights: number, paymentService: any) {
    // Calculate price
    const baseRate = Number(roomType.basePrice);
    const rate = baseRate * (1 + ratePlan.markup / 100) * (1 - ratePlan.discount / 100);
    const totalRoomCharge = rate * nights;
    const taxRate = property.taxRate ?? 0;
    const tax = totalRoomCharge * (taxRate / 100);
    const cityTax = totalRoomCharge * ((property.cityTaxRate ?? 0) / 100);
    const resortFee = Number(property.resortFee ?? 0) * nights;
    const totalAmount = totalRoomCharge + tax + cityTax + resortFee;
    const amountInCents = Math.round(totalAmount * 100);

    // Charge via Stripe (handled by PaymentService)
    const paymentResult = await paymentService.chargeCard({
      paymentMethodId: dto.paymentMethodId,
      amount: amountInCents,
      currency: property.currency ?? 'usd',
      description: `${property.name} - Room ${room.number} (${nights}n)`,
      metadata: { propertyId: property.id, guestEmail: dto.email },
    });

    // Find or create guest
    let guest = await this.prisma.guest.findFirst({
      where: { propertyId: property.id, email: dto.email },
    });
    if (!guest) {
      guest = await this.prisma.guest.create({
        data: {
          propertyId: property.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          nationality: dto.nationality,
        },
      });
    }

    // Create reservation + folio + payment atomically
    const reservation = await this.prisma.reservation.create({
      data: {
        propertyId: property.id,
        roomId: room.id,
        guestId: guest.id,
        ratePlanId: ratePlan.id,
        source: 'DIRECT',
        status: 'CONFIRMED',
        checkIn: new Date(dto.checkIn),
        checkOut: new Date(dto.checkOut),
        nights,
        adults: dto.adults,
        children: dto.children ?? 0,
        baseRate: rate,
        totalRoomCharge,
        totalTax: tax + cityTax,
        totalFees: resortFee,
        totalAmount,
        paidAmount: totalAmount,
        balanceDue: 0,
        currency: property.currency ?? 'USD',
        specialRequests: dto.specialRequests,
        folio: {
          create: {
            propertyId: property.id,
            totalCharges: totalAmount,
            totalPayments: totalAmount,
            totalTax: tax + cityTax,
            balance: 0,
            status: 'OPEN',
            charges: {
              create: [
                {
                  type: 'ROOM',
                  description: `${roomType.name} - ${nights} night${nights > 1 ? 's' : ''}`,
                  quantity: nights,
                  unitPrice: rate,
                  amount: totalRoomCharge,
                  taxRate,
                  taxAmount: tax,
                },
                ...(resortFee > 0 ? [{
                  type: 'RESORT_FEE' as any,
                  description: 'Resort Fee',
                  quantity: nights,
                  unitPrice: property.resortFee,
                  amount: resortFee,
                  taxRate: 0,
                  taxAmount: 0,
                }] : []),
              ],
            },
          },
        },
        payments: {
          create: {
            propertyId: property.id,
            amount: totalAmount,
            currency: property.currency ?? 'USD',
            method: 'CREDIT_CARD',
            status: 'CAPTURED',
            stripePaymentIntentId: paymentResult.id,
            reference: paymentResult.id,
            processedAt: new Date(),
          },
        },
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        ratePlan: true,
        folio: true,
      },
    });

    this.logger.log(`Online booking ${reservation.confirmationNo} created for ${dto.email}`);

    return {
      confirmationNo: reservation.confirmationNo,
      reservation,
      totalAmount,
      currency: property.currency ?? 'USD',
      message: 'Booking confirmed! Confirmation email will be sent shortly.',
    };
  }

  // ─── GET BOOKING (by confirmation # + email) ─────────────────────────────

  async getBooking(confirmationNo: string, email: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        confirmationNo,
        guest: { email: { equals: email, mode: 'insensitive' } },
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        ratePlan: true,
        folio: { include: { charges: { where: { voided: false } } } },
        payments: true,
      },
    });
    if (!reservation) throw new NotFoundException('Booking not found');
    return reservation;
  }

  // ─── CANCEL BOOKING (online) ─────────────────────────────────────────────

  async cancelBooking(confirmationNo: string, email: string, paymentService: any) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        confirmationNo,
        guest: { email: { equals: email, mode: 'insensitive' } },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: { ratePlan: true, payments: true, guest: true },
    });
    if (!reservation) throw new NotFoundException('Booking not found or cannot be cancelled');

    // Check cancellation policy
    const hoursUntilCheckIn = (reservation.checkIn.getTime() - Date.now()) / 3600000;
    const isRefundable = reservation.ratePlan?.isRefundable &&
      hoursUntilCheckIn >= (reservation.ratePlan?.cancellationHours ?? 48);

    let refundAmount = 0;
    if (isRefundable) {
      refundAmount = Number(reservation.totalAmount);
      // Process refund via Stripe
      const payment = reservation.payments.find(p => p.status === 'CAPTURED');
      if (payment?.stripePaymentIntentId) {
        await paymentService.refund(payment.stripePaymentIntentId, Math.round(refundAmount * 100));
      }
    }

    await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Guest cancelled online',
      },
    });

    return {
      cancelled: true,
      refundAmount,
      isRefundable,
      message: isRefundable
        ? `Refund of $${refundAmount.toFixed(2)} will be processed within 5-10 business days`
        : 'This booking is non-refundable per the rate plan policy',
    };
  }
}
