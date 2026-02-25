import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePricingRuleDto, UpdatePricingRuleDto } from './dto';

@Injectable()
export class RevenueIntelligenceService {
  constructor(private prisma: PrismaService) {}

  async listRules(propertyId: string) {
    return this.prisma.pricingRule.findMany({ where: { propertyId }, orderBy: { priority: 'desc' } });
  }

  async createRule(propertyId: string, dto: CreatePricingRuleDto) {
    return this.prisma.pricingRule.create({ data: { ...dto, conditions: dto.conditions as any, propertyId } });
  }

  async updateRule(id: string, propertyId: string, dto: UpdatePricingRuleDto) {
    const rule = await this.prisma.pricingRule.findFirst({ where: { id, propertyId } });
    if (!rule) throw new NotFoundException('Pricing rule not found');
    const data: any = { ...dto };
    if (dto.conditions) data.conditions = dto.conditions as any;
    return this.prisma.pricingRule.update({ where: { id }, data });
  }

  async deleteRule(id: string, propertyId: string) {
    const rule = await this.prisma.pricingRule.findFirst({ where: { id, propertyId } });
    if (!rule) throw new NotFoundException('Pricing rule not found');
    await this.prisma.pricingRule.delete({ where: { id } });
    return { message: 'Pricing rule deleted' };
  }

  async getForecast(propertyId: string, from: string, to: string) {
    const existing = await this.prisma.demandForecast.findMany({
      where: { propertyId, date: { gte: new Date(from), lte: new Date(to) } },
      orderBy: { date: 'asc' },
    });
    if (existing.length > 0) return existing;

    const totalRooms = await this.prisma.room.count({ where: { propertyId } });
    const forecasts: any[] = [];
    const start = new Date(from);
    const end = new Date(to);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const baseOcc = isWeekend ? 0.78 : 0.62;
      const variance = (Math.random() - 0.5) * 0.2;
      const occupancy = Math.min(0.98, Math.max(0.2, baseOcc + variance));
      const baseADR = isWeekend ? 189 : 149;
      const adr = baseADR * (1 + (occupancy - 0.6) * 0.5);
      const revpar = adr * occupancy;
      const demandLevel = occupancy > 0.85 ? 'PEAK' : occupancy > 0.7 ? 'HIGH' : occupancy > 0.5 ? 'NORMAL' : 'LOW';

      forecasts.push({
        propertyId, date: new Date(d),
        predictedOccupancy: Math.round(occupancy * 100) / 100,
        predictedADR: Math.round(adr * 100) / 100,
        predictedRevPAR: Math.round(revpar * 100) / 100,
        demandLevel, factors: { dayOfWeek, isWeekend, totalRooms },
      });
    }

    await this.prisma.demandForecast.createMany({ data: forecasts, skipDuplicates: true });
    return this.prisma.demandForecast.findMany({
      where: { propertyId, date: { gte: new Date(from), lte: new Date(to) } },
      orderBy: { date: 'asc' },
    });
  }

  async getRecommendations(propertyId: string, from: string, to: string) {
    const existing = await this.prisma.rateRecommendation.findMany({
      where: { propertyId, date: { gte: new Date(from), lte: new Date(to) }, applied: false },
      orderBy: { date: 'asc' },
    });
    if (existing.length > 0) return existing;

    const roomTypes = await this.prisma.roomType.findMany({ where: { propertyId, isActive: true } });
    const recs: any[] = [];
    const start = new Date(from);
    const end = new Date(to);

    for (const rt of roomTypes) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const isWeekend = d.getDay() === 5 || d.getDay() === 6;
        const currentRate = Number(rt.basePrice);
        const adjustment = isWeekend ? 1.15 + Math.random() * 0.15 : 0.95 + Math.random() * 0.1;
        const recommended = Math.round(currentRate * adjustment * 100) / 100;

        if (Math.abs(recommended - currentRate) > 5) {
          recs.push({
            propertyId, roomTypeCode: rt.code, date: new Date(d),
            currentRate, recommendedRate: recommended,
            reason: recommended > currentRate ? 'High demand expected' : 'Low demand - price to attract bookings',
            confidence: 0.6 + Math.random() * 0.35,
          });
        }
      }
    }

    if (recs.length > 0) await this.prisma.rateRecommendation.createMany({ data: recs, skipDuplicates: true });
    return this.prisma.rateRecommendation.findMany({
      where: { propertyId, date: { gte: new Date(from), lte: new Date(to) }, applied: false },
      orderBy: { date: 'asc' },
    });
  }

  async applyRecommendation(id: string, propertyId: string) {
    const rec = await this.prisma.rateRecommendation.findFirst({ where: { id, propertyId } });
    if (!rec) throw new NotFoundException('Recommendation not found');
    return this.prisma.rateRecommendation.update({ where: { id }, data: { applied: true, appliedAt: new Date() } });
  }

  async getCompetitorAnalysis(propertyId: string) {
    return {
      competitors: [
        { name: 'Competitor Hotel A', avgRate: 175, occupancy: 72, rating: 4.3, distance: '0.5 mi' },
        { name: 'Competitor Hotel B', avgRate: 195, occupancy: 68, rating: 4.1, distance: '0.8 mi' },
        { name: 'Competitor Hotel C', avgRate: 155, occupancy: 81, rating: 3.9, distance: '1.2 mi' },
        { name: 'Competitor Hotel D', avgRate: 210, occupancy: 65, rating: 4.5, distance: '1.5 mi' },
      ],
      marketAvgRate: 184, marketAvgOccupancy: 71.5, positionIndex: 0.85,
      lastUpdated: new Date().toISOString(),
    };
  }
}
