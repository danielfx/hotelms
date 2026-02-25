import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelStatus } from '@prisma/client';
import { ConnectChannelDto, UpdateChannelDto, SyncRatesDto, SyncInventoryDto } from './dto';

export interface SyncResult {
  channel: string;
  success: boolean;
  synced: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

// Simulated OTA API response structure — real impl would call Booking.com/Expedia APIs
interface OtaReservation {
  externalId: string;
  guestName: string;
  guestEmail?: string;
  roomTypeCode: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  totalAmount: number;
  commissionAmount: number;
  status: string;
  bookedAt: string;
}

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── LIST / GET ───────────────────────────────────────────────────────────

  async findAll(propertyId: string) {
    const connections = await this.prisma.channelConnection.findMany({
      where: { propertyId },
      include: {
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Enrich with stats
    const enriched = await Promise.all(connections.map(async (c) => {
      const [totalReservations, last30DayRevenue] = await Promise.all([
        this.prisma.reservation.count({ where: { propertyId, channelId: c.id } }),
        this.prisma.reservation.aggregate({
          where: {
            propertyId, channelId: c.id,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
          },
          _sum: { totalAmount: true },
        }),
      ]);
      return {
        ...c,
        stats: {
          totalReservations,
          last30DayRevenue: Number(last30DayRevenue._sum.totalAmount ?? 0),
        },
      };
    }));

    return enriched;
  }

  async findOne(id: string, propertyId: string) {
    const conn = await this.prisma.channelConnection.findFirst({
      where: { id, propertyId },
      include: {
        syncLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!conn) throw new NotFoundException('Channel connection not found');
    return conn;
  }

  // ─── CONNECT ──────────────────────────────────────────────────────────────

  async connect(propertyId: string, dto: ConnectChannelDto) {
    const existing = await this.prisma.channelConnection.findFirst({
      where: { propertyId, channel: dto.channel as any },
    });
    if (existing) throw new ConflictException(`${dto.channel} is already connected`);

    // In real impl: validate credentials with OTA API
    const isValid = await this.validateCredentials(dto);
    const status = isValid ? ChannelStatus.ACTIVE : ChannelStatus.ERROR;

    const connection = await this.prisma.channelConnection.create({
      data: {
        propertyId,
        channel: dto.channel as any,
        externalHotelId: dto.externalHotelId,
        apiKey: dto.apiKey,
        apiSecret: dto.apiSecret,
        status,
        autoSync: dto.autoSync ?? true,
        commissionPct: dto.commissionPct ?? 15,
        lastSyncAt: null,
      },
    });

    if (isValid) {
      // Log successful connection
      await this.logSync(connection.id, 'CONNECTION', true, 0, []);
    }

    return connection;
  }

  async update(id: string, propertyId: string, dto: UpdateChannelDto) {
    const conn = await this.prisma.channelConnection.findFirst({ where: { id, propertyId } });
    if (!conn) throw new NotFoundException('Channel not found');
    return this.prisma.channelConnection.update({ where: { id }, data: dto });
  }

  async disconnect(id: string, propertyId: string) {
    const conn = await this.prisma.channelConnection.findFirst({ where: { id, propertyId } });
    if (!conn) throw new NotFoundException('Channel not found');
    await this.prisma.channelConnection.update({
      where: { id },
      data: { status: ChannelStatus.INACTIVE },
    });
    return { message: `${conn.channel} disconnected` };
  }

  // ─── SYNC RATES ───────────────────────────────────────────────────────────

  async syncRates(id: string, propertyId: string, dto: SyncRatesDto): Promise<SyncResult> {
    const start = Date.now();
    const conn = await this.prisma.channelConnection.findFirst({ where: { id, propertyId } });
    if (!conn) throw new NotFoundException('Channel not found');

    const errors: string[] = [];
    let synced = 0;

    try {
      // Gather rates to push
      const dateFrom = new Date(dto.dateFrom);
      const dateTo = new Date(dto.dateTo);

      const roomTypes = await this.prisma.roomType.findMany({
        where: {
          propertyId,
          ...(dto.roomTypeCodes?.length ? { code: { in: dto.roomTypeCodes } } : {}),
        },
      });

      const dailyRates = await this.prisma.dailyRate.findMany({
        where: {
          ...(dto.ratePlanId ? { ratePlanId: dto.ratePlanId } : {}),
          date: { gte: dateFrom, lte: dateTo },
          roomTypeCode: { in: roomTypes.map(r => r.code) },
        },
      });

      // In real impl: POST to OTA rate/inventory API endpoint
      // For each OTA the API shape differs:
      // Booking.com: ARI (Availability, Rates, Inventory) push
      // Expedia: EQC (Expedia QuickConnect) SOAP/REST
      // Airbnb: Listing calendar via REST

      for (const rate of dailyRates) {
        try {
          await this.pushRateToChannel(conn.channel, conn.externalHotelId, {
            roomTypeCode: rate.roomTypeCode,
            date: rate.date.toISOString().split('T')[0],
            price: Number(rate.price),
            available: rate.available ?? 10,
            closed: rate.closed,
            minLOS: rate.minLOS,
          });
          synced++;
        } catch (e: any) {
          errors.push(`${rate.roomTypeCode} ${rate.date.toISOString().split('T')[0]}: ${e.message}`);
        }
      }

      // Update last sync
      await this.prisma.channelConnection.update({
        where: { id },
        data: { lastSyncAt: new Date(), status: errors.length > 0 ? ChannelStatus.ERROR : ChannelStatus.ACTIVE },
      });
    } catch (e: any) {
      errors.push(e.message);
    }

    const result: SyncResult = {
      channel: conn.channel,
      success: errors.length === 0,
      synced,
      errors,
      duration: Date.now() - start,
      timestamp: new Date(),
    };

    await this.logSync(id, 'RATES', result.success, synced, errors);
    this.logger.log(`Rate sync to ${conn.channel}: ${synced} pushed, ${errors.length} errors`);
    return result;
  }

  // ─── SYNC INVENTORY ───────────────────────────────────────────────────────

  async syncInventory(id: string, propertyId: string, dto: SyncInventoryDto): Promise<SyncResult> {
    const start = Date.now();
    const conn = await this.prisma.channelConnection.findFirst({ where: { id, propertyId } });
    if (!conn) throw new NotFoundException('Channel not found');

    const errors: string[] = [];
    let synced = 0;

    try {
      const dateFrom = new Date(dto.dateFrom);
      const dateTo = new Date(dto.dateTo);

      const roomTypes = await this.prisma.roomType.findMany({
        where: {
          propertyId,
          ...(dto.roomTypeCodes?.length ? { code: { in: dto.roomTypeCodes } } : {}),
        },
        include: { rooms: true },
      });

      for (const rt of roomTypes) {
        let cur = new Date(dateFrom);
        while (cur <= dateTo) {
          const dateStr = cur.toISOString().split('T')[0];
          const next = new Date(cur); next.setDate(cur.getDate() + 1);

          // Count available rooms for this date
          const bookedCount = await this.prisma.reservation.count({
            where: {
              propertyId,
              status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
              room: { roomTypeId: rt.id },
              AND: [{ checkIn: { lt: next } }, { checkOut: { gt: cur } }],
            },
          });

          const totalRooms = rt.rooms.filter(r =>
            !['OUT_OF_ORDER', 'MAINTENANCE'].includes(r.status)
          ).length;
          const available = Math.max(0, totalRooms - bookedCount);

          try {
            await this.pushInventoryToChannel(conn.channel, conn.externalHotelId, {
              roomTypeCode: rt.code,
              date: dateStr,
              available,
            });
            synced++;
          } catch (e: any) {
            errors.push(`${rt.code} ${dateStr}: ${e.message}`);
          }

          cur.setDate(cur.getDate() + 1);
        }
      }

      await this.prisma.channelConnection.update({
        where: { id },
        data: { lastSyncAt: new Date(), status: errors.length > 0 ? ChannelStatus.ERROR : ChannelStatus.ACTIVE },
      });
    } catch (e: any) {
      errors.push(e.message);
    }

    const result: SyncResult = {
      channel: conn.channel,
      success: errors.length === 0,
      synced,
      errors,
      duration: Date.now() - start,
      timestamp: new Date(),
    };

    await this.logSync(id, 'INVENTORY', result.success, synced, errors);
    return result;
  }

  // ─── PULL RESERVATIONS ────────────────────────────────────────────────────

  async pullReservations(id: string, propertyId: string): Promise<SyncResult> {
    const start = Date.now();
    const conn = await this.prisma.channelConnection.findFirst({ where: { id, propertyId } });
    if (!conn) throw new NotFoundException('Channel not found');

    const errors: string[] = [];
    let synced = 0;

    // In real impl: fetch new/modified reservations from OTA API
    const otaReservations = await this.fetchReservationsFromChannel(conn.channel, conn.externalHotelId);

    for (const otaRes of otaReservations) {
      try {
        // Skip if already imported
        const exists = await this.prisma.reservation.findFirst({
          where: { externalId: otaRes.externalId, channelId: id },
        });
        if (exists) continue;

        // Find or create guest
        let guest = otaRes.guestEmail
          ? await this.prisma.guest.findFirst({ where: { propertyId, email: otaRes.guestEmail } })
          : null;

        const [firstName, ...rest] = otaRes.guestName.split(' ');
        if (!guest) {
          guest = await this.prisma.guest.create({
            data: {
              propertyId,
              firstName,
              lastName: rest.join(' ') || firstName,
              email: otaRes.guestEmail,
            },
          });
        }

        // Find room type
        const roomType = await this.prisma.roomType.findFirst({
          where: { propertyId, code: otaRes.roomTypeCode },
          include: {
            rooms: {
              where: { status: 'AVAILABLE' },
              take: 1,
            },
          },
        });

        if (!roomType || !roomType.rooms[0]) {
          errors.push(`No available room for type ${otaRes.roomTypeCode}`);
          continue;
        }

        await this.prisma.reservation.create({
          data: {
            propertyId,
            roomId: roomType.rooms[0].id,
            guestId: guest.id,
            channelId: id,
            externalId: otaRes.externalId,
            source: conn.channel as any,
            status: 'CONFIRMED',
            checkIn: new Date(otaRes.checkIn),
            checkOut: new Date(otaRes.checkOut),
            nights: Math.ceil((new Date(otaRes.checkOut).getTime() - new Date(otaRes.checkIn).getTime()) / 86400000),
            adults: otaRes.adults,
            totalAmount: otaRes.totalAmount,
            commission: otaRes.commissionAmount,
            commissionPct: conn.commissionPct,
            paidAmount: otaRes.totalAmount,
            balanceDue: 0,
            currency: 'USD',
          },
        });

        synced++;
      } catch (e: any) {
        errors.push(`${otaRes.externalId}: ${e.message}`);
      }
    }

    const result: SyncResult = {
      channel: conn.channel,
      success: errors.length === 0,
      synced,
      errors,
      duration: Date.now() - start,
      timestamp: new Date(),
    };

    await this.logSync(id, 'RESERVATIONS', result.success, synced, errors);
    return result;
  }

  // ─── SYNC ALL CHANNELS ───────────────────────────────────────────────────

  async syncAll(propertyId: string): Promise<SyncResult[]> {
    const connections = await this.prisma.channelConnection.findMany({
      where: { propertyId, status: ChannelStatus.ACTIVE, autoSync: true },
    });

    const today = new Date().toISOString().split('T')[0];
    const in90 = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

    const results = await Promise.allSettled(
      connections.map(async (conn) => {
        const ratesResult = await this.syncRates(conn.id, propertyId, { dateFrom: today, dateTo: in90 });
        const invResult = await this.syncInventory(conn.id, propertyId, { dateFrom: today, dateTo: in90 });
        return { ...ratesResult, synced: ratesResult.synced + invResult.synced };
      })
    );

    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<SyncResult>).value);
  }

  // ─── SYNC LOGS ────────────────────────────────────────────────────────────

  async getSyncLogs(id: string, propertyId: string, limit = 50) {
    const conn = await this.prisma.channelConnection.findFirst({ where: { id, propertyId } });
    if (!conn) throw new NotFoundException('Channel not found');

    return this.prisma.channelSyncLog.findMany({
      where: { connectionId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private async validateCredentials(dto: ConnectChannelDto): Promise<boolean> {
    // In real impl: make a test API call to validate credentials
    // For now, simulate success if credentials are provided
    return !!(dto.apiKey || dto.username);
  }

  private async pushRateToChannel(channel: string, hotelId: string, rate: any): Promise<void> {
    // Simulate API call — real impl would use channel-specific SDK/REST calls
    await new Promise(r => setTimeout(r, 10)); // simulate network
    this.logger.debug(`Pushed rate to ${channel}: ${rate.roomTypeCode} ${rate.date} $${rate.price}`);
  }

  private async pushInventoryToChannel(channel: string, hotelId: string, inv: any): Promise<void> {
    await new Promise(r => setTimeout(r, 5));
    this.logger.debug(`Pushed inventory to ${channel}: ${inv.roomTypeCode} ${inv.date} ${inv.available} avail`);
  }

  private async fetchReservationsFromChannel(channel: string, hotelId: string): Promise<OtaReservation[]> {
    // Simulate incoming reservations from OTA
    return [];
  }

  private async logSync(connectionId: string, type: string, success: boolean, count: number, errors: string[]) {
    await this.prisma.channelSyncLog.create({
      data: {
        connectionId,
        type: type as any,
        success,
        recordsProcessed: count,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  }
}
