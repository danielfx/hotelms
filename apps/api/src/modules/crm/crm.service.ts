import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSegmentDto, CreateCampaignDto, UpdateCampaignDto } from './dto';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async listSegments(propertyId: string) {
    return this.prisma.guestSegment.findMany({ where: { propertyId }, orderBy: { createdAt: 'desc' } });
  }

  async createSegment(propertyId: string, dto: CreateSegmentDto) {
    const guestCount = await this.countGuestsForRules(propertyId, dto.rules);
    return this.prisma.guestSegment.create({
      data: { ...dto, rules: dto.rules as any, propertyId, guestCount },
    });
  }

  async updateSegment(id: string, propertyId: string, dto: Partial<CreateSegmentDto>) {
    const seg = await this.prisma.guestSegment.findFirst({ where: { id, propertyId } });
    if (!seg) throw new NotFoundException('Segment not found');
    const data: any = { ...dto };
    if (dto.rules) {
      data.rules = dto.rules as any;
      data.guestCount = await this.countGuestsForRules(propertyId, dto.rules);
    }
    return this.prisma.guestSegment.update({ where: { id }, data });
  }

  async deleteSegment(id: string, propertyId: string) {
    const seg = await this.prisma.guestSegment.findFirst({ where: { id, propertyId } });
    if (!seg) throw new NotFoundException('Segment not found');
    await this.prisma.guestSegment.delete({ where: { id } });
    return { message: 'Segment deleted' };
  }

  private async countGuestsForRules(propertyId: string, rules: Record<string, any>[]) {
    const where: any = { propertyId };
    for (const rule of rules) {
      if (rule.field === 'vip' && rule.value === true) where.vip = true;
      if (rule.field === 'totalStays' && rule.operator === 'gte') where.totalStays = { gte: Number(rule.value) };
      if (rule.field === 'country') where.country = rule.value;
    }
    return this.prisma.guest.count({ where });
  }

  async listCampaigns(propertyId: string) {
    return this.prisma.emailCampaign.findMany({
      where: { propertyId },
      include: { segment: { select: { name: true, guestCount: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(id: string, propertyId: string) {
    const campaign = await this.prisma.emailCampaign.findFirst({
      where: { id, propertyId },
      include: { segment: true, sends: { take: 50, orderBy: { createdAt: 'desc' } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(propertyId: string, dto: CreateCampaignDto) {
    return this.prisma.emailCampaign.create({
      data: { ...dto, propertyId, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null },
    });
  }

  async updateCampaign(id: string, propertyId: string, dto: UpdateCampaignDto) {
    const camp = await this.prisma.emailCampaign.findFirst({ where: { id, propertyId } });
    if (!camp) throw new NotFoundException('Campaign not found');
    return this.prisma.emailCampaign.update({
      where: { id },
      data: { ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined },
    });
  }

  async sendCampaign(id: string, propertyId: string) {
    const campaign = await this.prisma.emailCampaign.findFirst({ where: { id, propertyId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const guests = await this.prisma.guest.findMany({
      where: { propertyId, email: { not: null } },
      select: { email: true },
      take: 1000,
    });

    const sends = guests.filter(g => g.email).map(g => ({
      campaignId: id, guestEmail: g.email!, status: 'SENT', sentAt: new Date(),
    }));

    if (sends.length > 0) {
      await this.prisma.emailSend.createMany({ data: sends });
    }

    return this.prisma.emailCampaign.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), totalSent: sends.length },
    });
  }

  async getCampaignAnalytics(id: string, propertyId: string) {
    const campaign = await this.prisma.emailCampaign.findFirst({ where: { id, propertyId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    const openRate = campaign.totalSent > 0 ? Math.round((campaign.totalOpened / campaign.totalSent) * 100) : 0;
    const clickRate = campaign.totalSent > 0 ? Math.round((campaign.totalClicked / campaign.totalSent) * 100) : 0;
    const bounceRate = campaign.totalSent > 0 ? Math.round((campaign.totalBounced / campaign.totalSent) * 100) : 0;
    return { ...campaign, openRate, clickRate, bounceRate };
  }
}
