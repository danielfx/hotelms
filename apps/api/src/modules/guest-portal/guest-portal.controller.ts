import { Controller, Get, Post, Body, Param, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { GuestPortalService } from './guest-portal.service';

@ApiTags('Guest Portal (Public)')
@Controller('portal')
export class GuestPortalController {
  constructor(private readonly svc: GuestPortalService) {}

  private async ctx(token: string) { return this.svc.verifyGuestToken(token.replace('Bearer ', '')); }

  @Public()
  @Post('auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate guest via confirmation# + last name' })
  auth(@Body() body: { confirmationNo: string; lastName: string }) {
    return this.svc.authenticateGuest(body.confirmationNo, body.lastName);
  }

  @Public()
  @Get('me')
  getPortal(@Headers('authorization') auth: string) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.getPortalData(ctx));
  }

  @Public()
  @Post('checkin')
  @HttpCode(HttpStatus.OK)
  onlineCheckIn(@Headers('authorization') auth: string, @Body() dto: any) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.onlineCheckIn(ctx, dto));
  }

  @Public()
  @Get('requests')
  getRequests(@Headers('authorization') auth: string) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.getServiceRequests(ctx));
  }

  @Public()
  @Post('requests')
  createRequest(@Headers('authorization') auth: string, @Body() dto: any) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.createServiceRequest(ctx, dto));
  }

  @Public()
  @Post('requests/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelRequest(@Param('id') id: string, @Headers('authorization') auth: string) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.cancelServiceRequest(ctx, id));
  }

  @Public()
  @Get('messages')
  getMessages(@Headers('authorization') auth: string) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.getMessages(ctx));
  }

  @Public()
  @Post('messages')
  sendMessage(@Headers('authorization') auth: string, @Body('content') content: string) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.sendMessage(ctx, content));
  }

  @Public()
  @Get('folio')
  getFolio(@Headers('authorization') auth: string) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.getFolio(ctx));
  }

  @Public()
  @Get('digital-key')
  getKey(@Headers('authorization') auth: string) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.getDigitalKey(ctx));
  }

  @Public()
  @Post('review')
  submitReview(@Headers('authorization') auth: string, @Body() dto: any) {
    return this.svc.verifyGuestToken(auth?.replace('Bearer ', '')).then(ctx => this.svc.submitReview(ctx, dto));
  }
}
