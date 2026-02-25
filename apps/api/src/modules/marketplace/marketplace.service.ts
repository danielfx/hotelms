import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApiKeyDto, CreateWebhookDto, UpdateWebhookDto } from './dto';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async listApiKeys(propertyId: string) {
    return this.prisma.apiKey.findMany({
      where: { propertyId },
      select: { id: true, name: true, permissions: true, isActive: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApiKey(propertyId: string, dto: CreateApiKeyDto) {
    const rawKey = `hms_${randomBytes(32).toString('hex')}`;
    const secret = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.create({
      data: { propertyId, name: dto.name, key: rawKey, secret, permissions: dto.scopes || [] },
    });
    return { id: apiKey.id, name: apiKey.name, key: rawKey, message: 'Store this key securely — it will not be shown again.' };
  }

  async revokeApiKey(id: string, propertyId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, propertyId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({ where: { id }, data: { isActive: false } });
    return { message: 'API key revoked' };
  }

  async listWebhooks(propertyId: string) {
    return this.prisma.webhook.findMany({ where: { propertyId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebhook(propertyId: string, dto: CreateWebhookDto) {
    const secret = dto.secret || randomBytes(32).toString('hex');
    return this.prisma.webhook.create({
      data: { propertyId, url: dto.url, events: dto.events as any, secret },
    });
  }

  async updateWebhook(id: string, propertyId: string, dto: UpdateWebhookDto) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, propertyId } });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return this.prisma.webhook.update({ where: { id }, data: dto as any });
  }

  async deleteWebhook(id: string, propertyId: string) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, propertyId } });
    if (!webhook) throw new NotFoundException('Webhook not found');
    await this.prisma.webhook.delete({ where: { id } });
    return { message: 'Webhook deleted' };
  }

  async getWebhookDeliveries(webhookId: string) {
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listIntegrations(propertyId: string) {
    return this.prisma.integration.findMany({ where: { propertyId }, orderBy: { name: 'asc' } });
  }

  async getIntegrationCatalog() {
    return [
      { id: 'stripe', name: 'Stripe', category: 'Payments', description: 'Accept payments via Stripe' },
      { id: 'mailchimp', name: 'Mailchimp', category: 'Marketing', description: 'Email marketing automation' },
      { id: 'quickbooks', name: 'QuickBooks', category: 'Accounting', description: 'Sync invoices and payments' },
      { id: 'google-analytics', name: 'Google Analytics', category: 'Analytics', description: 'Track website performance' },
      { id: 'twilio', name: 'Twilio', category: 'Communications', description: 'SMS and voice notifications' },
      { id: 'zapier', name: 'Zapier', category: 'Automation', description: 'Connect 5000+ apps' },
    ];
  }

  async toggleIntegration(integrationId: string, propertyId: string, enabled: boolean) {
    const integration = await this.prisma.integration.findFirst({ where: { id: integrationId, propertyId } });
    if (!integration) throw new NotFoundException('Integration not found');
    return this.prisma.integration.update({ where: { id: integrationId }, data: { isActive: enabled } });
  }
}
