import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(propertyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalRooms, occupiedRooms, todayArrivals, todayDepartures, pendingHK] = await Promise.all([
      this.prisma.room.count({ where: { propertyId } }),
      this.prisma.room.count({ where: { propertyId, status: 'OCCUPIED' } }),
      this.prisma.reservation.count({ where: { propertyId, checkIn: { gte: today, lt: tomorrow }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } } }),
      this.prisma.reservation.count({ where: { propertyId, checkOut: { gte: today, lt: tomorrow }, status: 'CHECKED_IN' } }),
      this.prisma.housekeepingTask.count({ where: { propertyId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentCharges = await this.prisma.folioCharge.findMany({
      where: {
        voided: false,
        date: { gte: thirtyDaysAgo },
        folio: { reservation: { propertyId } },
      },
      select: { amount: true },
    });
    const monthRevenue = recentCharges.reduce((sum, c) => sum + Number(c.amount), 0);

    return { totalRooms, occupiedRooms, occupancyRate, todayArrivals, todayDepartures, pendingHK, monthRevenue };
  }

  async getOccupancyReport(propertyId: string, from: string, to: string) {
    const startDate = new Date(from);
    const endDate = new Date(to);
    const totalRooms = await this.prisma.room.count({ where: { propertyId } });
    const days: { date: string; occupied: number; rate: number; revenue: number }[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const occupied = await this.prisma.reservation.count({
        where: { propertyId, checkIn: { lte: dayStart }, checkOut: { gt: dayStart }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
      });
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayCharges = await this.prisma.folioCharge.findMany({
        where: {
          voided: false,
          date: { gte: dayStart, lt: dayEnd },
          folio: { reservation: { propertyId } },
        },
        select: { amount: true },
      });
      const dayRevenue = dayCharges.reduce((sum, c) => sum + Number(c.amount), 0);
      days.push({ date: dayStart.toISOString().split('T')[0], occupied, rate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0, revenue: dayRevenue });
    }

    const avgOccupancy = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.rate, 0) / days.length) : 0;
    return { totalRooms, days, avgOccupancy };
  }

  async getRevenueReport(propertyId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const toDateEnd = new Date(toDate);
    toDateEnd.setDate(toDateEnd.getDate() + 1);

    const charges = await this.prisma.folioCharge.findMany({
      where: {
        voided: false,
        date: { gte: fromDate, lt: toDateEnd },
        folio: { reservation: { propertyId } },
      },
      select: { amount: true, type: true, date: true, folio: { select: { reservation: { select: { source: true } } } } },
    });

    const totalRevenue = charges.reduce((s, c) => s + Number(c.amount), 0);

    // By charge type
    const byType: Record<string, number> = {};
    charges.forEach(c => { byType[c.type] = (byType[c.type] || 0) + Number(c.amount); });

    // By booking source
    const bySource: Record<string, number> = {};
    charges.forEach(c => {
      const src = c.folio?.reservation?.source || 'DIRECT';
      bySource[src] = (bySource[src] || 0) + Number(c.amount);
    });

    // By day
    const byDay: Record<string, number> = {};
    charges.forEach(c => {
      const day = c.date.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + Number(c.amount);
    });

    // By room type
    const roomCharges = await this.prisma.folioCharge.findMany({
      where: {
        voided: false,
        type: 'ROOM',
        date: { gte: fromDate, lt: toDateEnd },
        folio: { reservation: { propertyId } },
      },
      select: { amount: true, folio: { select: { reservation: { select: { room: { select: { roomType: { select: { name: true, id: true } } } } } } } } },
    });

    const rtMap: Record<string, { name: string; revenue: number; nights: number }> = {};
    for (const c of roomCharges) {
      const rt = c.folio?.reservation?.room?.roomType;
      if (rt) {
        if (!rtMap[rt.id]) rtMap[rt.id] = { name: rt.name, revenue: 0, nights: 0 };
        rtMap[rt.id].revenue += Number(c.amount);
      }
    }

    // Get room counts per type
    const roomTypes = await this.prisma.roomType.findMany({
      where: { propertyId },
      select: { id: true, name: true, _count: { select: { rooms: true } } },
    });

    const dayCount = Math.max(1, Math.ceil((toDateEnd.getTime() - fromDate.getTime()) / 86400000));
    const byRoomType = roomTypes.map(rt => {
      const data = rtMap[rt.id] || { revenue: 0, nights: 0 };
      const rooms = rt._count.rooms;
      const available = rooms * dayCount;
      // Count room nights for this type
      return {
        type: rt.name,
        rooms,
        revenue: Math.round(data.revenue * 100) / 100,
        adr: data.revenue > 0 ? Math.round((data.revenue / Math.max(1, rooms)) * 100) / 100 : 0,
        revpar: available > 0 ? Math.round((data.revenue / available) * 100) / 100 : 0,
        occupancy: 0, // Will be set below
      };
    });

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      byType,
      bySource: Object.entries(bySource).map(([source, amount]) => ({
        source,
        amount: Math.round(amount * 100) / 100,
      })),
      byDay,
      byRoomType,
      totalTransactions: charges.length,
    };
  }

  async getArrivalsReport(propertyId: string, date: string) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    return this.prisma.reservation.findMany({
      where: { propertyId, checkIn: { gte: d, lt: next }, status: { in: ['CONFIRMED', 'PENDING'] } },
      include: { guest: true, room: { include: { roomType: true } } },
      orderBy: { eta: 'asc' },
    });
  }

  async getDeparturesReport(propertyId: string, date: string) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    return this.prisma.reservation.findMany({
      where: { propertyId, checkOut: { gte: d, lt: next }, status: 'CHECKED_IN' },
      include: { guest: true, room: { include: { roomType: true } }, folio: true },
      orderBy: { room: { number: 'asc' } },
    });
  }

  async getNightAuditSummary(propertyId: string, date: string) {
    const report = await this.prisma.report.findFirst({
      where: { propertyId, type: 'NIGHT_AUDIT', date: new Date(date) },
    });
    return report || { message: 'No night audit report found for this date' };
  }

  // ─── USALI REPORT ──────────────────────────────────────────────────────────

  async getUsaliReport(propertyId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    // Adjust toDate to end of day for inclusive range
    const toDateEnd = new Date(toDate);
    toDateEnd.setDate(toDateEnd.getDate() + 1);

    // ── Revenue from FolioCharge ──
    const charges = await this.prisma.folioCharge.findMany({
      where: {
        voided: false,
        date: { gte: fromDate, lt: toDateEnd },
        folio: {
          reservation: { propertyId },
        },
      },
      select: { type: true, amount: true },
    });

    // Map charge types to USALI departments
    const roomsChargeTypes = ['ROOM', 'EARLY_CHECKIN', 'LATE_CHECKOUT', 'UPGRADE'];
    const fbChargeTypes = ['FB', 'MINIBAR'];
    const otherDeptMap: Record<string, string> = {
      SPA: 'spa',
      PARKING: 'parking',
      LAUNDRY: 'laundry',
      TELEPHONE: 'telephone',
    };
    const taxTypes = ['TAX', 'CITY_TAX'];

    let roomsRevenue = 0;
    let fbRevenue = 0;
    const otherDeptRevenue: Record<string, number> = { spa: 0, parking: 0, laundry: 0, telephone: 0 };
    let taxTotal = 0;
    let cityTaxTotal = 0;
    let resortFeeTotal = 0;

    for (const c of charges) {
      const amt = Number(c.amount);
      if (roomsChargeTypes.includes(c.type)) {
        roomsRevenue += amt;
      } else if (fbChargeTypes.includes(c.type)) {
        fbRevenue += amt;
      } else if (otherDeptMap[c.type]) {
        otherDeptRevenue[otherDeptMap[c.type]] += amt;
      } else if (c.type === 'TAX') {
        taxTotal += amt;
      } else if (c.type === 'CITY_TAX') {
        cityTaxTotal += amt;
      } else if (c.type === 'RESORT_FEE') {
        resortFeeTotal += amt;
      }
    }

    // ── Expenses from DepartmentExpense ──
    const expenses = await this.prisma.departmentExpense.findMany({
      where: {
        propertyId,
        month: { gte: fromDate, lte: toDate },
      },
    });

    const deptExpenses: Record<string, Record<string, number>> = {};
    const undistributed: Record<string, number> = { admin: 0, marketing: 0, maintenance: 0, energy: 0 };
    const undistributedDepts = ['ADMIN', 'MARKETING', 'MAINTENANCE', 'ENERGY'];

    for (const e of expenses) {
      const amt = Number(e.amount);
      const dept = e.department.toLowerCase();
      const cat = e.category.toLowerCase();

      if (undistributedDepts.includes(e.department)) {
        undistributed[dept] += amt;
      } else {
        if (!deptExpenses[dept]) deptExpenses[dept] = {};
        deptExpenses[dept][cat] = (deptExpenses[dept][cat] || 0) + amt;
      }
    }

    const buildDept = (name: string, revenue: number) => {
      const exp = deptExpenses[name] || {};
      const totalExpenses = Object.values(exp).reduce((s, v) => s + v, 0);
      return {
        revenue: Math.round(revenue * 100) / 100,
        expenses: exp,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        profit: Math.round((revenue - totalExpenses) * 100) / 100,
      };
    };

    const departments = {
      rooms: buildDept('rooms', roomsRevenue),
      fb: buildDept('fb', fbRevenue),
      spa: buildDept('spa', otherDeptRevenue.spa),
      parking: buildDept('parking', otherDeptRevenue.parking),
      laundry: buildDept('laundry', otherDeptRevenue.laundry),
      telephone: buildDept('telephone', otherDeptRevenue.telephone),
    };

    const totalRevenue = Object.values(departments).reduce((s, d) => s + d.revenue, 0);
    const totalDeptExpenses = Object.values(departments).reduce((s, d) => s + d.totalExpenses, 0);
    const totalDeptProfit = Object.values(departments).reduce((s, d) => s + d.profit, 0);
    const undistributedTotal = Object.values(undistributed).reduce((s, v) => s + v, 0);
    const gop = totalDeptProfit - undistributedTotal;
    const gopMargin = totalRevenue > 0 ? Math.round((gop / totalRevenue) * 1000) / 10 : 0;

    // ── KPIs from Reservations ──
    const totalRooms = await this.prisma.room.count({ where: { propertyId } });
    const dayCount = Math.max(1, Math.ceil((toDateEnd.getTime() - fromDate.getTime()) / 86400000));
    const availableNights = totalRooms * dayCount;

    const reservations = await this.prisma.reservation.findMany({
      where: {
        propertyId,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { lt: toDateEnd },
        checkOut: { gt: fromDate },
      },
      select: { checkIn: true, checkOut: true, nights: true, totalRoomCharge: true },
    });

    // Calculate room nights that overlap with the period
    let roomNightsSold = 0;
    for (const r of reservations) {
      const rStart = new Date(r.checkIn) < fromDate ? fromDate : new Date(r.checkIn);
      const rEnd = new Date(r.checkOut) > toDateEnd ? toDateEnd : new Date(r.checkOut);
      const nights = Math.max(0, Math.ceil((rEnd.getTime() - rStart.getTime()) / 86400000));
      roomNightsSold += nights;
    }

    const occupancy = availableNights > 0 ? Math.round((roomNightsSold / availableNights) * 1000) / 10 : 0;
    const adr = roomNightsSold > 0 ? Math.round((roomsRevenue / roomNightsSold) * 100) / 100 : 0;
    const revpar = availableNights > 0 ? Math.round((roomsRevenue / availableNights) * 100) / 100 : 0;
    const trevpar = availableNights > 0 ? Math.round((totalRevenue / availableNights) * 100) / 100 : 0;

    return {
      period: { from, to },
      kpis: { roomNightsSold, availableNights, occupancy, adr, revpar, trevpar },
      departments,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalDeptExpenses: Math.round(totalDeptExpenses * 100) / 100,
      totalDeptProfit: Math.round(totalDeptProfit * 100) / 100,
      undistributed: { ...undistributed, total: Math.round(undistributedTotal * 100) / 100 },
      gop: Math.round(gop * 100) / 100,
      gopMargin,
      taxes: { propertyTax: Math.round(taxTotal * 100) / 100, cityTax: Math.round(cityTaxTotal * 100) / 100 },
      resortFees: Math.round(resortFeeTotal * 100) / 100,
    };
  }

  // ─── USALI EXPENSES CRUD ───────────────────────────────────────────────────

  async getUsaliExpenses(propertyId: string, month?: string, department?: string) {
    const where: any = { propertyId };
    if (month) where.month = new Date(month);
    if (department) where.department = department;

    return this.prisma.departmentExpense.findMany({
      where,
      orderBy: [{ department: 'asc' }, { category: 'asc' }],
    });
  }

  async addUsaliExpense(propertyId: string, data: { department: string; category: string; description: string; amount: number; month: string }) {
    return this.prisma.departmentExpense.create({
      data: {
        propertyId,
        department: data.department,
        category: data.category,
        description: data.description,
        amount: data.amount,
        month: new Date(data.month),
      },
    });
  }

  async deleteUsaliExpense(propertyId: string, id: string) {
    const expense = await this.prisma.departmentExpense.findFirst({
      where: { id, propertyId },
    });
    if (!expense) {
      throw new Error('Expense not found');
    }
    return this.prisma.departmentExpense.delete({ where: { id } });
  }
}
