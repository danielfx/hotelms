import { Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FolioService } from './folio.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { AddChargeDto, AddPaymentDto } from '../reservations/dto';

@ApiTags('Folio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('folio')
export class FolioController {
  constructor(private readonly svc: FolioService) {}

  @Get('reservation/:reservationId')
  @ApiOperation({ summary: 'Get folio for a reservation' })
  getByReservation(@Param('reservationId') reservationId: string, @PropertyId() pid: string) {
    return this.svc.getByReservation(reservationId, pid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folio by ID' })
  getById(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post(':id/charges')
  @ApiOperation({ summary: 'Post a charge to folio (minibar, F&B, laundry, etc.)' })
  addCharge(@Param('id') id: string, @Body() dto: AddChargeDto, @CurrentUser() user: any) {
    return this.svc.addCharge(id, dto, user.id);
  }

  @Patch('charges/:chargeId/void')
  @ApiOperation({ summary: 'Void a folio charge' })
  voidCharge(@Param('chargeId') chargeId: string, @CurrentUser() user: any) {
    return this.svc.voidCharge(chargeId, user.id);
  }

  @Post('reservation/:reservationId/payments')
  @ApiOperation({ summary: 'Record a payment against a reservation' })
  addPayment(
    @Param('reservationId') reservationId: string,
    @Body() dto: AddPaymentDto,
    @PropertyId() pid: string,
    @CurrentUser() user: any,
  ) {
    return this.svc.addPayment(reservationId, dto, pid, user.id);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close folio (balance must be zero)' })
  close(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.closeFolio(id, user.id);
  }

  @Post(':id/invoice')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate invoice PDF data from closed folio' })
  invoice(@Param('id') id: string) {
    return this.svc.generateInvoice(id);
  }

  @Post('night-audit/room-charges')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post nightly room charges for all checked-in guests' })
  postNightlyCharges(
    @PropertyId() pid: string,
    @Body('date') date: string,
    @CurrentUser() user: any,
  ) {
    return this.svc.postNightlyRoomCharges(pid, date ?? new Date().toISOString().split('T')[0], user.id);
  }
}
