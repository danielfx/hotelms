import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly svc: CommunicationsService) {}

  @Get('inbox')
  @ApiOperation({ summary: 'Get all guest conversations grouped by reservation' })
  getInbox(@PropertyId() pid: string, @Query('unreadOnly') unreadOnly?: boolean, @Query('channel') channel?: string) {
    return this.svc.getInbox(pid, { unreadOnly, channel });
  }

  @Get('stats')
  getStats(@PropertyId() pid: string) { return this.svc.getStats(pid); }

  @Get('templates')
  getTemplates(@PropertyId() pid: string) { return this.svc.getTemplates(pid); }

  @Post('templates')
  upsertTemplate(@PropertyId() pid: string, @Body() dto: any) { return this.svc.upsertTemplate(pid, dto); }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send ad-hoc message to a guest' })
  send(@PropertyId() pid: string, @Body() dto: any) {
    return this.svc.sendMessage({ propertyId: pid, ...dto });
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send bulk message to guest segment' })
  bulk(@PropertyId() pid: string, @Body() dto: any) { return this.svc.sendBulkMessage(pid, dto); }

  @Post('reservations/:id/reply')
  @HttpCode(HttpStatus.OK)
  reply(@Param('id') id: string, @PropertyId() pid: string, @Body() body: any, @CurrentUser() user: any) {
    return this.svc.replyToGuest(pid, id, body.message, body.channel, user.id);
  }

  // Trigger automated sends
  @Post('reservations/:id/booking-confirmation')
  @HttpCode(HttpStatus.OK)
  sendConfirmation(@Param('id') id: string) { return this.svc.sendBookingConfirmation(id); }

  @Post('reservations/:id/pre-arrival')
  @HttpCode(HttpStatus.OK)
  sendPreArrival(@Param('id') id: string) { return this.svc.sendPreArrival(id); }

  @Post('reservations/:id/welcome')
  @HttpCode(HttpStatus.OK)
  sendWelcome(@Param('id') id: string) { return this.svc.sendCheckInWelcome(id); }

  @Post('reservations/:id/checkout-receipt')
  @HttpCode(HttpStatus.OK)
  sendReceipt(@Param('id') id: string) { return this.svc.sendCheckOutReceipt(id); }

  @Post('reservations/:id/review-request')
  @HttpCode(HttpStatus.OK)
  sendReview(@Param('id') id: string) { return this.svc.sendReviewRequest(id); }
}
