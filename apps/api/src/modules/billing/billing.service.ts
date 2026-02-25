import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } });
  }

  async getSubscription(propertyId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { propertyId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) return { status: 'NO_SUBSCRIPTION', message: 'No active subscription' };
    return subscription;
  }

  async createSubscription(propertyId: string, dto: CreateSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    const existing = await this.prisma.subscription.findFirst({ where: { propertyId, status: 'ACTIVE' } });
    if (existing) throw new BadRequestException('Active subscription already exists. Update or cancel first.');
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    return this.prisma.subscription.create({
      data: { propertyId, planId: dto.planId, status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: periodEnd },
      include: { plan: true },
    });
  }

  async updateSubscription(propertyId: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findFirst({ where: { propertyId, status: 'ACTIVE' } });
    if (!subscription) throw new NotFoundException('No active subscription');
    const data: any = {};
    if (dto.planId) data.planId = dto.planId;
    if (dto.status) data.status = dto.status;
    return this.prisma.subscription.update({ where: { id: subscription.id }, data, include: { plan: true } });
  }

  async cancelSubscription(propertyId: string) {
    const subscription = await this.prisma.subscription.findFirst({ where: { propertyId, status: 'ACTIVE' } });
    if (!subscription) throw new NotFoundException('No active subscription');
    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { plan: true },
    });
  }

  async listInvoices(propertyId: string) {
    return this.prisma.billingInvoice.findMany({
      where: { subscription: { propertyId } },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });
  }

  async getUsageMetrics(propertyId: string) {
    const [rooms, reservations, guests, users] = await Promise.all([
      this.prisma.room.count({ where: { propertyId } }),
      this.prisma.reservation.count({ where: { propertyId } }),
      this.prisma.guest.count({ where: { propertyId } }),
      this.prisma.propertyUser.count({ where: { propertyId, user: { isActive: true } } }),
    ]);
    return { rooms, reservations, guests, activeUsers: users };
  }
}
