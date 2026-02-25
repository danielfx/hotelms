import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CreateApiKeyDto, CreateWebhookDto, UpdateWebhookDto } from './dto';

@ApiTags('Marketplace & Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('api-keys')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  listApiKeys(@PropertyId() propertyId: string) {
    return this.marketplaceService.listApiKeys(propertyId);
  }

  @Post('api-keys')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  createApiKey(@PropertyId() propertyId: string, @Body() dto: CreateApiKeyDto) {
    return this.marketplaceService.createApiKey(propertyId, dto);
  }

  @Delete('api-keys/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  revokeApiKey(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.marketplaceService.revokeApiKey(id, propertyId);
  }

  @Get('webhooks')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  listWebhooks(@PropertyId() propertyId: string) {
    return this.marketplaceService.listWebhooks(propertyId);
  }

  @Post('webhooks')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  createWebhook(@PropertyId() propertyId: string, @Body() dto: CreateWebhookDto) {
    return this.marketplaceService.createWebhook(propertyId, dto);
  }

  @Patch('webhooks/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  updateWebhook(@Param('id') id: string, @PropertyId() propertyId: string, @Body() dto: UpdateWebhookDto) {
    return this.marketplaceService.updateWebhook(id, propertyId, dto);
  }

  @Delete('webhooks/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  deleteWebhook(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.marketplaceService.deleteWebhook(id, propertyId);
  }

  @Get('webhooks/:id/deliveries')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  getWebhookDeliveries(@Param('id') webhookId: string) {
    return this.marketplaceService.getWebhookDeliveries(webhookId);
  }

  @Get('integrations')
  listIntegrations(@PropertyId() propertyId: string) {
    return this.marketplaceService.listIntegrations(propertyId);
  }

  @Get('catalog')
  getIntegrationCatalog() {
    return this.marketplaceService.getIntegrationCatalog();
  }

  @Patch('integrations/:id/toggle')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  toggleIntegration(@Param('id') id: string, @PropertyId() propertyId: string, @Body('enabled') enabled: boolean) {
    return this.marketplaceService.toggleIntegration(id, propertyId, enabled);
  }
}
