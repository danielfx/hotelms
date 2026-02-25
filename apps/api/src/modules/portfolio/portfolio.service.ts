import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const userProperties = await this.prisma.propertyUser.findMany({
      where: { userId }, include: { property: true },
    });
    const propertyIds = userProperties.map(up => up.propertyId);

    const stats = await Promise.all(propertyIds.map(async (pid) => {
      const [totalRooms, occupiedRooms, todayArrivals, monthRevenue] = await Promise.all([
        this.prisma.room.count({ where: { propertyId: pid } }),
        this.prisma.room.count({ where: { propertyId: pid, status: 'OCCUPIED' } }),
        this.prisma.reservation.count({
          where: { propertyId: pid, checkIn: { gte: new Date(new Date().setHours(0,0,0,0)), lt: new Date(new Date().setHours(24,0,0,0)) }, status: { in: ['CONFIRMED', 'PENDING'] } },
        }),
        this.prisma.payment.aggregate({ where: { propertyId: pid, status: 'CAPTURED', createdAt: { gte: new Date(Date.now() - 30 * 86400000) } }, _sum: { amount: true } }),
      ]);
      const property = userProperties.find(up => up.propertyId === pid)!.property;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      return { propertyId: pid, propertyName: property.name, propertyType: property.type, city: property.city, totalRooms, occupiedRooms, occupancyRate, todayArrivals, monthRevenue: Number(monthRevenue._sum.amount || 0) };
    }));

    const totalRooms = stats.reduce((s, p) => s + p.totalRooms, 0);
    const totalOccupied = stats.reduce((s, p) => s + p.occupiedRooms, 0);
    const totalRevenue = stats.reduce((s, p) => s + p.monthRevenue, 0);
    const avgOccupancy = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;

    return { summary: { totalProperties: propertyIds.length, totalRooms, totalOccupied, avgOccupancy, totalRevenue }, properties: stats };
  }

  async getCrossPropertyKPIs(userId: string, from: string, to: string) {
    const userProperties = await this.prisma.propertyUser.findMany({
      where: { userId }, include: { property: { select: { id: true, name: true } } },
    });
    return Promise.all(userProperties.map(async (up) => {
      const [reservations, payments] = await Promise.all([
        this.prisma.reservation.count({ where: { propertyId: up.propertyId, createdAt: { gte: new Date(from), lte: new Date(to) } } }),
        this.prisma.payment.aggregate({ where: { propertyId: up.propertyId, status: 'CAPTURED', createdAt: { gte: new Date(from), lte: new Date(to) } }, _sum: { amount: true } }),
      ]);
      return { propertyId: up.propertyId, propertyName: up.property.name, totalReservations: reservations, revenue: Number(payments._sum.amount || 0) };
    }));
  }

  async getConsolidatedReport(userId: string, from: string, to: string) {
    const kpis = await this.getCrossPropertyKPIs(userId, from, to);
    const totalRevenue = kpis.reduce((s, k) => s + k.revenue, 0);
    const totalReservations = kpis.reduce((s, k) => s + k.totalReservations, 0);
    return { period: { from, to }, totals: { revenue: totalRevenue, reservations: totalReservations, properties: kpis.length }, byProperty: kpis };
  }
}
