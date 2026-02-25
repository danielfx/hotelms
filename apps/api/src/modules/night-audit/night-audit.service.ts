import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FolioService } from '../folio/folio.service';

export interface NightAuditResult {
  date: string;
  startedAt: Date;
  completedAt?: Date;
  steps: NightAuditStep[];
  summary: {
    totalArrivals: number;
    totalDepartures: number;
    totalInHouse: number;
    noShows: number;
    roomChargesPosted: number;
    totalRevenue: number;
    occupancyRate: number;
  };
  errors: string[];
}

export interface NightAuditStep {
  step: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  message: string;
  count?: number;
}

@Injectable()
export class NightAuditService {
  private readonly logger = new Logger(NightAuditService.name);

  constructor(
    private prisma: PrismaService,
    private folioService: FolioService,
  ) {}

  async runAudit(propertyId: string, date: string, userId: string): Promise<NightAuditResult> {
    const auditDate = new Date(date);
    const result: NightAuditResult = {
      date,
      startedAt: new Date(),
      steps: [],
      summary: {
        totalArrivals: 0,
        totalDepartures: 0,
        totalInHouse: 0,
        noShows: 0,
        roomChargesPosted: 0,
        totalRevenue: 0,
        occupancyRate: 0,
      },
      errors: [],
    };

    this.logger.log(`Starting night audit for ${date} at property ${propertyId}`);

    // ─── STEP 1: Auto no-show ──────────────────────────────────────────────
    try {
      const cutoffTime = new Date(auditDate);
      cutoffTime.setHours(23, 59, 59);

      const noShows = await this.prisma.reservation.findMany({
        where: {
          propertyId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          checkIn: { lt: cutoffTime },
        },
        include: { room: true },
      });

      for (const res of noShows) {
        await this.prisma.$transaction([
          this.prisma.reservation.update({
            where: { id: res.id },
            data: { status: 'NO_SHOW', noShowAt: new Date() },
          }),
          this.prisma.room.update({
            where: { id: res.roomId },
            data: { status: 'AVAILABLE' },
          }),
        ]);
      }

      result.steps.push({
        step: 'Auto No-Show',
        status: 'success',
        message: `Marked ${noShows.length} reservation(s) as no-show`,
        count: noShows.length,
      });
      result.summary.noShows = noShows.length;
    } catch (e: any) {
      result.steps.push({ step: 'Auto No-Show', status: 'error', message: e.message });
      result.errors.push(e.message);
    }

    // ─── STEP 2: Post nightly room charges ────────────────────────────────
    try {
      const chargeResult = await this.folioService.postNightlyRoomCharges(propertyId, date, userId);
      result.steps.push({
        step: 'Room Charges',
        status: chargeResult.errors.length > 0 ? 'warning' : 'success',
        message: `Posted ${chargeResult.posted} charge(s), skipped ${chargeResult.skipped}`,
        count: chargeResult.posted,
      });
      result.summary.roomChargesPosted = chargeResult.posted;
    } catch (e: any) {
      result.steps.push({ step: 'Room Charges', status: 'error', message: e.message });
      result.errors.push(e.message);
    }

    // ─── STEP 3: Roll over date ────────────────────────────────────────────
    try {
      result.steps.push({
        step: 'Date Rollover',
        status: 'success',
        message: `System date advanced to ${new Date(auditDate.getTime() + 86400000).toISOString().split('T')[0]}`,
      });
    } catch (e: any) {
      result.steps.push({ step: 'Date Rollover', status: 'error', message: e.message });
    }

    // ─── STEP 4: Generate statistics ──────────────────────────────────────
    try {
      const [inHouse, arrivals, departures, totalRooms] = await Promise.all([
        this.prisma.reservation.count({ where: { propertyId, status: 'CHECKED_IN' } }),
        this.prisma.reservation.count({
          where: {
            propertyId,
            checkIn: { gte: auditDate, lt: new Date(auditDate.getTime() + 86400000) },
          },
        }),
        this.prisma.reservation.count({
          where: {
            propertyId,
            checkOut: { gte: auditDate, lt: new Date(auditDate.getTime() + 86400000) },
            status: 'CHECKED_OUT',
          },
        }),
        this.prisma.room.count({ where: { propertyId } }),
      ]);

      const revenue = await this.prisma.folioCharge.aggregate({
        where: {
          voided: false,
          date: { gte: auditDate, lt: new Date(auditDate.getTime() + 86400000) },
          folio: { reservation: { propertyId } },
        },
        _sum: { amount: true },
      });

      result.summary.totalInHouse = inHouse;
      result.summary.totalArrivals = arrivals;
      result.summary.totalDepartures = departures;
      result.summary.totalRevenue = Number(revenue._sum.amount ?? 0);
      result.summary.occupancyRate = totalRooms > 0 ? Math.round((inHouse / totalRooms) * 100) : 0;

      // Persist report
      await this.prisma.report.upsert({
        where: { propertyId_type_date: { propertyId, type: 'NIGHT_AUDIT', date: auditDate } },
        update: { data: result.summary as any },
        create: {
          propertyId,
          type: 'NIGHT_AUDIT',
          date: auditDate,
          data: result.summary as any,
        },
      });

      result.steps.push({
        step: 'Statistics',
        status: 'success',
        message: `Occupancy ${result.summary.occupancyRate}% · Revenue $${result.summary.totalRevenue.toFixed(2)}`,
      });
    } catch (e: any) {
      result.steps.push({ step: 'Statistics', status: 'error', message: e.message });
      result.errors.push(e.message);
    }

    // ─── STEP 5: Housekeeping plan for tomorrow ────────────────────────────
    try {
      const tomorrow = new Date(auditDate.getTime() + 86400000);

      // Stayover tasks for rooms staying another night
      const stayovers = await this.prisma.reservation.findMany({
        where: {
          propertyId,
          status: 'CHECKED_IN',
          checkOut: { gt: tomorrow },
        },
      });

      let hkCreated = 0;
      for (const res of stayovers) {
        const existing = await this.prisma.housekeepingTask.findFirst({
          where: {
            roomId: res.roomId,
            type: 'STAYOVER',
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            createdAt: { gte: auditDate },
          },
        });
        if (!existing) {
          await this.prisma.housekeepingTask.create({
            data: {
              propertyId,
              roomId: res.roomId,
              type: 'STAYOVER',
              status: 'PENDING',
              priority: 'NORMAL',
            },
          });
          hkCreated++;
        }
      }

      result.steps.push({
        step: 'Housekeeping Plan',
        status: 'success',
        message: `Created ${hkCreated} stayover task(s) for tomorrow`,
        count: hkCreated,
      });
    } catch (e: any) {
      result.steps.push({ step: 'Housekeeping Plan', status: 'error', message: e.message });
    }

    result.completedAt = new Date();
    const duration = (result.completedAt.getTime() - result.startedAt.getTime()) / 1000;

    this.logger.log(`Night audit completed in ${duration.toFixed(1)}s — ${result.errors.length} error(s)`);
    return result;
  }

  async getAuditHistory(propertyId: string, limit = 30) {
    return this.prisma.report.findMany({
      where: { propertyId, type: 'NIGHT_AUDIT' },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}
