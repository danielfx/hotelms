import { Controller, Get, Post, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'PROPERTY_OWNER')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  listPlans() {
    return this.billingService.listPlans();
  }

  @Get('subscription')
  getSubscription(@PropertyId() propertyId: string) {
    return this.billingService.getSubscription(propertyId);
  }

  @Post('subscription')
  createSubscription(@PropertyId() propertyId: string, @Body() dto: CreateSubscriptionDto) {
    return this.billingService.createSubscription(propertyId, dto);
  }

  @Patch('subscription')
  updateSubscription(@PropertyId() propertyId: string, @Body() dto: UpdateSubscriptionDto) {
    return this.billingService.updateSubscription(propertyId, dto);
  }

  @Delete('subscription')
  cancelSubscription(@PropertyId() propertyId: string) {
    return this.billingService.cancelSubscription(propertyId);
  }

  @Get('invoices')
  listInvoices(@PropertyId() propertyId: string) {
    return this.billingService.listInvoices(propertyId);
  }

  @Get('usage')
  getUsageMetrics(@PropertyId() propertyId: string) {
    return this.billingService.getUsageMetrics(propertyId);
  }
}
