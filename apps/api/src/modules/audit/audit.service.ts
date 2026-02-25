import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async searchAuditLogs(propertyId: string, filters: { action?: string; userId?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const where: any = { propertyId };
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.userId) where.userId = filters.userId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { user: { select: { email: true, name: true } } } }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getSecurityDashboard(propertyId: string) {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalLogs24h, failedLogins24h, totalLogsWeek, activeUsers] = await Promise.all([
      this.prisma.auditLog.count({ where: { propertyId, createdAt: { gte: dayAgo } } }),
      this.prisma.auditLog.count({ where: { propertyId, action: 'LOGIN_FAILED', createdAt: { gte: dayAgo } } }),
      this.prisma.auditLog.count({ where: { propertyId, createdAt: { gte: weekAgo } } }),
      this.prisma.propertyUser.count({ where: { propertyId, user: { isActive: true } } }),
    ]);

    return { totalLogs24h, failedLogins24h, totalLogsWeek, activeUsers };
  }

  async exportGuestData(propertyId: string, guestId: string) {
    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, propertyId },
      include: { reservations: true },
    });
    return { guest, exportedAt: new Date().toISOString(), format: 'JSON' };
  }

  async deleteGuestData(propertyId: string, guestId: string) {
    const guest = await this.prisma.guest.findFirst({ where: { id: guestId, propertyId } });
    if (!guest) return { message: 'Guest not found' };
    await this.prisma.guest.update({
      where: { id: guestId },
      data: { firstName: 'DELETED', lastName: 'DELETED', email: null, phone: null, address: null, notes: null },
    });
    return { message: 'Guest data anonymized per GDPR request' };
  }

  async getPermissionsMatrix(propertyId: string) {
    const propertyUsers = await this.prisma.propertyUser.findMany({
      where: { propertyId, user: { isActive: true } },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { role: 'asc' },
    });
    const users = propertyUsers.map(pu => ({ ...pu.user, role: pu.role }));
    const roles = ['SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'FRONT_DESK', 'HOUSEKEEPING_MANAGER', 'REVENUE_MANAGER', 'FB_MANAGER', 'GROUP_COORDINATOR', 'NIGHT_AUDITOR', 'MAINTENANCE', 'STAFF'];
    const permissions = {
      SUPER_ADMIN: ['*'],
      PROPERTY_OWNER: ['properties.*', 'reservations.*', 'guests.*', 'rooms.*', 'rates.*', 'reports.*', 'users.*'],
      GENERAL_MANAGER: ['reservations.*', 'guests.*', 'rooms.*', 'rates.*', 'reports.*', 'housekeeping.*', 'groups.*'],
      FRONT_DESK: ['reservations.*', 'guests.*', 'rooms.read', 'folio.*'],
      HOUSEKEEPING_MANAGER: ['housekeeping.*', 'rooms.read'],
      REVENUE_MANAGER: ['rates.*', 'reports.*', 'revenue.*'],
      FB_MANAGER: ['groups.events.*', 'reports.read'],
      GROUP_COORDINATOR: ['groups.*', 'reservations.read'],
      NIGHT_AUDITOR: ['night-audit.*', 'reservations.read', 'folio.read'],
      MAINTENANCE: ['housekeeping.read', 'rooms.read'],
      STAFF: ['reservations.read', 'rooms.read'],
    };
    return { users, roles, permissions };
  }
}
