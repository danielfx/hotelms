import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  private readonly allSteps = [
    { id: 'property-setup', title: 'Property Setup', description: 'Configure property name, address, and basic details' },
    { id: 'room-types', title: 'Room Types', description: 'Define room types, capacities, and base rates' },
    { id: 'rooms', title: 'Room Inventory', description: 'Add individual rooms and assign to room types' },
    { id: 'rates', title: 'Rate Plans', description: 'Create rate plans and seasonal pricing' },
    { id: 'staff', title: 'Staff Accounts', description: 'Invite team members and assign roles' },
    { id: 'payment', title: 'Payment Setup', description: 'Configure payment methods and tax settings' },
    { id: 'channels', title: 'Channel Manager', description: 'Connect OTAs and distribution channels' },
    { id: 'booking-engine', title: 'Booking Engine', description: 'Set up your direct booking website widget' },
  ];

  async getProgress(propertyId: string) {
    const progressRows = await this.prisma.onboardingProgress.findMany({ where: { propertyId } });
    const completedSteps = progressRows.filter(p => p.completed).map(p => p.step);
    const steps = this.allSteps.map(s => ({ ...s, completed: completedSteps.includes(s.id) }));
    return {
      steps,
      completedCount: completedSteps.length,
      totalSteps: this.allSteps.length,
      percentComplete: Math.round((completedSteps.length / this.allSteps.length) * 100),
    };
  }

  async completeStep(propertyId: string, stepId: string) {
    const existing = await this.prisma.onboardingProgress.findUnique({
      where: { propertyId_step: { propertyId, step: stepId } },
    });
    if (existing) {
      return this.prisma.onboardingProgress.update({
        where: { id: existing.id },
        data: { completed: true, completedAt: new Date() },
      });
    }
    return this.prisma.onboardingProgress.create({
      data: { propertyId, step: stepId, completed: true, completedAt: new Date() },
    });
  }

  async listHelpArticles(category?: string) {
    const where: any = { isPublished: true };
    if (category) where.category = category;
    return this.prisma.helpArticle.findMany({ where, orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, category: true, slug: true, sortOrder: true } });
  }

  async getHelpArticle(slug: string) {
    return this.prisma.helpArticle.findFirst({ where: { slug, isPublished: true } });
  }

  async searchHelp(query: string) {
    return this.prisma.helpArticle.findMany({
      where: { isPublished: true, OR: [{ title: { contains: query, mode: 'insensitive' } }, { body: { contains: query, mode: 'insensitive' } }] },
      select: { id: true, title: true, category: true, slug: true },
      take: 10,
    });
  }
}
