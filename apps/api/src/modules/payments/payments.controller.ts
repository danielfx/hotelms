import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundPaymentDto } from '../booking-engine/dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('intent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe PaymentIntent (returns clientSecret for frontend)' })
  createIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.svc.createPaymentIntent(dto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm payment after 3DS / user action' })
  confirm(@Body() dto: ConfirmPaymentDto) {
    return this.svc.confirmPayment(dto);
  }

  @Post('refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process refund (staff only)' })
  refund(@Body() dto: RefundPaymentDto, @PropertyId() pid: string) {
    return this.svc.processRefundDto(dto, pid);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  getHistory(@PropertyId() pid: string, @Query('limit') limit?: number) {
    return this.svc.getPaymentHistory(pid, limit);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  getStats(@PropertyId() pid: string) {
    return this.svc.getStats(pid);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint — must be public, no auth' })
  webhook(@Req() req: any, @Headers('stripe-signature') sig: string) {
    return this.svc.handleWebhook(req.rawBody, sig);
  }
}
