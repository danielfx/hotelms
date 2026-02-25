import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateRatePlanDto, UpdateRatePlanDto, SetDailyRateDto,
  BulkUpdateRatesDto, GetRatesDto, PriceQuoteDto
} from './dto';

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);

  constructor(private prisma: PrismaService) {}

  // ─── RATE PLANS ───────────────────────────────────────────────────────────

  async findAllPlans(propertyId: string) {
    return this.prisma.ratePlan.findMany({
      where: { propertyId, isActive: true },
      include: {
        _count: { select: { reservations: true, dailyRates: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOnePlan(id: string, propertyId: string) {
    const plan = await this.prisma.ratePlan.findFirst({
      where: { id, propertyId },
      include: { _count: { select: { reservations: true } } },
    });
    if (!plan) throw new NotFoundException('Rate plan not found');
    return plan;
  }

  async createPlan(propertyId: string, dto: CreateRatePlanDto) {
    const exists = await this.prisma.ratePlan.findUnique({
      where: { propertyId_code: { propertyId, code: dto.code.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Rate plan with code ${dto.code} already exists`);

    return this.prisma.ratePlan.create({
      data: {
        ...dto,
        propertyId,
        code: dto.code.toUpperCase(),
        type: dto.type ?? 'PUBLIC',
        mealPlan: dto.mealPlan ?? 'ROOM_ONLY',
        cancellationPolicy: dto.cancellationPolicy ?? 'MODERATE',
        cancellationHours: dto.cancellationHours ?? 48,
        cancellationPct: dto.cancellationPct ?? 100,
        minLOS: dto.minLOS ?? 1,
        markup: dto.markup ?? 0,
        discount: dto.discount ?? 0,
        isRefundable: dto.isRefundable ?? true,
        availableOnline: dto.availableOnline ?? true,
      },
    });
  }

  async updatePlan(id: string, propertyId: string, dto: UpdateRatePlanDto) {
    const plan = await this.prisma.ratePlan.findFirst({ where: { id, propertyId } });
    if (!plan) throw new NotFoundException('Rate plan not found');
    return this.prisma.ratePlan.update({ where: { id }, data: dto });
  }

  async deactivatePlan(id: string, propertyId: string) {
    const plan = await this.prisma.ratePlan.findFirst({ where: { id, propertyId } });
    if (!plan) throw new NotFoundException('Rate plan not found');
    return this.prisma.ratePlan.update({ where: { id }, data: { isActive: false } });
  }

  async duplicatePlan(id: string, propertyId: string, newCode: string, newName: string) {
    const source = await this.prisma.ratePlan.findFirst({ where: { id, propertyId } });
    if (!source) throw new NotFoundException('Rate plan not found');

    const exists = await this.prisma.ratePlan.findUnique({
      where: { propertyId_code: { propertyId, code: newCode.toUpperCase() } },
    });
    if (exists) throw new ConflictException(`Code ${newCode} already exists`);

    const { id: _id, createdAt, updatedAt, ...rest } = source;
    return this.prisma.ratePlan.create({
      data: { ...rest, propertyId, code: newCode.toUpperCase(), name: newName },
    });
  }

  // ─── DAILY RATES ──────────────────────────────────────────────────────────

  async getDailyRates(ratePlanId: string, propertyId: string, filter: GetRatesDto) {
    // Verify ownership
    const plan = await this.prisma.ratePlan.findFirst({ where: { id: ratePlanId, propertyId } });
    if (!plan) throw new NotFoundException('Rate plan not found');

    const where: Prisma.DailyRateWhereInput = { ratePlanId };
    if (filter.roomTypeCode) where.roomTypeCode = filter.roomTypeCode;
    if (filter.dateFrom) where.date = { gte: new Date(filter.dateFrom) };
    if (filter.dateTo) where.date = { ...where.date as any, lte: new Date(filter.dateTo) };

    const rates = await this.prisma.dailyRate.findMany({
      where,
      orderBy: [{ date: 'asc' }, { roomTypeCode: 'asc' }],
    });

    // Build grid: roomTypeCode -> date -> rate
    const grid: Record<string, Record<string, any>> = {};
    for (const r of rates) {
      const dateStr = r.date.toISOString().split('T')[0];
      if (!grid[r.roomTypeCode]) grid[r.roomTypeCode] = {};
      grid[r.roomTypeCode][dateStr] = r;
    }

    return { rates, grid };
  }

  async setDailyRate(ratePlanId: string, propertyId: string, dto: SetDailyRateDto) {
    const plan = await this.prisma.ratePlan.findFirst({ where: { id: ratePlanId, propertyId } });
    if (!plan) throw new NotFoundException('Rate plan not found');

    return this.prisma.dailyRate.upsert({
      where: {
        ratePlanId_roomTypeCode_date: {
          ratePlanId,
          roomTypeCode: dto.roomTypeCode.toUpperCase(),
          date: new Date(dto.date),
        },
      },
      update: {
        price: dto.price,
        available: dto.available,
        minLOS: dto.minLOS,
        closed: dto.closed ?? false,
        closedToArrival: dto.closedToArrival ?? false,
        closedToDeparture: dto.closedToDeparture ?? false,
      },
      create: {
        ratePlanId,
        roomTypeCode: dto.roomTypeCode.toUpperCase(),
        date: new Date(dto.date),
        price: dto.price,
        available: dto.available ?? 10,
        minLOS: dto.minLOS,
        closed: dto.closed ?? false,
        closedToArrival: dto.closedToArrival ?? false,
        closedToDeparture: dto.closedToDeparture ?? false,
      },
    });
  }

  async bulkUpdateRates(propertyId: string, dto: BulkUpdateRatesDto) {
    const plan = await this.prisma.ratePlan.findFirst({
      where: { id: dto.ratePlanId, propertyId },
    });
    if (!plan) throw new NotFoundException('Rate plan not found');

    const dateFrom = new Date(dto.dateFrom);
    const dateTo = new Date(dto.dateTo);
    if (dateFrom > dateTo) throw new BadRequestException('dateFrom must be before dateTo');

    const updates: Prisma.DailyRateUpsertArgs[] = [];
    let current = new Date(dateFrom);
    let count = 0;

    while (current <= dateTo) {
      const dow = current.getDay(); // 0=Sun, 6=Sat
      if (!dto.daysOfWeek || dto.daysOfWeek.includes(dow)) {
        const date = new Date(current);
        const key = {
          ratePlanId: dto.ratePlanId,
          roomTypeCode: dto.roomTypeCode.toUpperCase(),
          date,
        };
        await this.prisma.dailyRate.upsert({
          where: { ratePlanId_roomTypeCode_date: key },
          update: {
            price: dto.price,
            ...(dto.available !== undefined && { available: dto.available }),
            ...(dto.closed !== undefined && { closed: dto.closed }),
            ...(dto.closedToArrival !== undefined && { closedToArrival: dto.closedToArrival }),
            ...(dto.closedToDeparture !== undefined && { closedToDeparture: dto.closedToDeparture }),
          },
          create: {
            ...key,
            price: dto.price,
            available: dto.available ?? 10,
            closed: dto.closed ?? false,
            closedToArrival: dto.closedToArrival ?? false,
            closedToDeparture: dto.closedToDeparture ?? false,
          },
        });
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    this.logger.log(`Bulk updated ${count} daily rates for plan ${dto.ratePlanId}`);
    return { updated: count, dateFrom: dto.dateFrom, dateTo: dto.dateTo };
  }

  // ─── PRICE QUOTE ENGINE ───────────────────────────────────────────────────

  async getPriceQuote(propertyId: string, dto: PriceQuoteDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    if (checkIn >= checkOut) throw new BadRequestException('checkOut must be after checkIn');

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);

    // Get room type base price
    const roomType = await this.prisma.roomType.findFirst({
      where: { propertyId, code: dto.roomTypeCode.toUpperCase() },
    });
    if (!roomType) throw new NotFoundException(`Room type ${dto.roomTypeCode} not found`);

    // Get property settings
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });

    // Get all active rate plans
    const ratePlans = await this.prisma.ratePlan.findMany({
      where: { propertyId, isActive: true },
    });

    const quotes = [];

    for (const plan of ratePlans) {
      if (dto.ratePlanId && plan.id !== dto.ratePlanId) continue;

      // Validate LOS restrictions
      if (nights < plan.minLOS) continue;
      if (plan.maxLOS && nights > plan.maxLOS) continue;

      // Get daily rates for this plan + room type
      const dailyRates = await this.prisma.dailyRate.findMany({
        where: {
          ratePlanId: plan.id,
          roomTypeCode: dto.roomTypeCode.toUpperCase(),
          date: { gte: checkIn, lt: checkOut },
        },
        orderBy: { date: 'asc' },
      });

      let totalRate = 0;
      const breakdown: { date: string; price: number; source: string }[] = [];
      let hasClosure = false;

      for (let i = 0; i < nights; i++) {
        const date = new Date(checkIn);
        date.setDate(checkIn.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const dailyRate = dailyRates.find(
          r => r.date.toISOString().split('T')[0] === dateStr
        );

        // Check restrictions
        if (dailyRate?.closed) { hasClosure = true; break; }
        if (i === 0 && dailyRate?.closedToArrival) { hasClosure = true; break; }
        if (i === nights - 1 && dailyRate?.closedToDeparture) { hasClosure = true; break; }

        let nightPrice: number;
        let source: string;

        if (dailyRate) {
          nightPrice = Number(dailyRate.price);
          source = 'daily_rate';
        } else {
          // Fall back to base price with plan markup/discount
          const base = Number(roomType.basePrice);
          nightPrice = base * (1 + (plan.markup / 100)) * (1 - (plan.discount / 100));
          source = 'base_price';
        }

        totalRate += nightPrice;
        breakdown.push({ date: dateStr, price: nightPrice, source });
      }

      if (hasClosure) continue;

      const taxRate = property?.taxRate ?? 0;
      const cityTaxRate = property?.cityTaxRate ?? 0;
      const resortFee = (property?.resortFee ?? 0);
      const tax = totalRate * (taxRate / 100);
      const cityTax = totalRate * (cityTaxRate / 100);
      const totalFees = resortFee;
      const totalWithTax = totalRate + tax + cityTax + totalFees;
      const adr = nights > 0 ? totalRate / nights : 0;

      quotes.push({
        ratePlan: {
          id: plan.id,
          name: plan.name,
          code: plan.code,
          type: plan.type,
          mealPlan: plan.mealPlan,
          cancellationPolicy: plan.cancellationPolicy,
          cancellationHours: plan.cancellationHours,
          isRefundable: plan.isRefundable,
        },
        roomType: {
          code: roomType.code,
          name: roomType.name,
          basePrice: roomType.basePrice,
        },
        checkIn: dto.checkIn,
        checkOut: dto.checkOut,
        nights,
        adults: dto.adults ?? 1,
        totalRoomRate: totalRate,
        adr: Math.round(adr * 100) / 100,
        tax,
        cityTax,
        resortFee: totalFees,
        totalAmount: Math.round(totalWithTax * 100) / 100,
        breakdown,
        currency: property?.currency ?? 'USD',
      });
    }

    // Sort by total price ascending
    quotes.sort((a, b) => a.totalAmount - b.totalAmount);

    return {
      roomType: { code: roomType.code, name: roomType.name },
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      nights,
      quotes,
      cheapest: quotes[0] ?? null,
    };
  }

  // ─── RATE CALENDAR (grid view) ────────────────────────────────────────────

  async getRateCalendar(propertyId: string, dateFrom: string, dateTo: string) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const [plans, roomTypes, dailyRates] = await Promise.all([
      this.prisma.ratePlan.findMany({ where: { propertyId, isActive: true }, orderBy: { createdAt: 'asc' } }),
      this.prisma.roomType.findMany({ where: { propertyId, isActive: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.dailyRate.findMany({
        where: {
          ratePlan: { propertyId },
          date: { gte: from, lte: to },
        },
        orderBy: [{ date: 'asc' }],
      }),
    ]);

    // Build date range
    const dates: string[] = [];
    let cur = new Date(from);
    while (cur <= to) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    // Grid: planId -> roomTypeCode -> date -> rate
    const grid: Record<string, Record<string, Record<string, any>>> = {};
    for (const rate of dailyRates) {
      const dateStr = rate.date.toISOString().split('T')[0];
      if (!grid[rate.ratePlanId]) grid[rate.ratePlanId] = {};
      if (!grid[rate.ratePlanId][rate.roomTypeCode]) grid[rate.ratePlanId][rate.roomTypeCode] = {};
      grid[rate.ratePlanId][rate.roomTypeCode][dateStr] = rate;
    }

    return { plans, roomTypes, dates, grid };
  }

  // ─── DEMAND STATS (for revenue management) ───────────────────────────────

  async getDemandStats(propertyId: string, dateFrom: string, dateTo: string) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        propertyId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        AND: [{ checkIn: { lt: to } }, { checkOut: { gt: from } }],
      },
      include: { room: { include: { roomType: true } } },
    });

    const totalRooms = await this.prisma.room.count({ where: { propertyId } });

    // Per-day occupancy
    const dates: string[] = [];
    let cur = new Date(from);
    while (cur < to) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    const dailyStats = dates.map(dateStr => {
      const d = new Date(dateStr);
      const occupied = reservations.filter(r =>
        r.checkIn <= d && r.checkOut > d
      ).length;
      return {
        date: dateStr,
        occupied,
        occupancyRate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
        dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
      };
    });

    const avgOccupancy = dailyStats.length > 0
      ? Math.round(dailyStats.reduce((s, d) => s + d.occupancyRate, 0) / dailyStats.length)
      : 0;

    return { dailyStats, avgOccupancy, totalRooms };
  }
}
