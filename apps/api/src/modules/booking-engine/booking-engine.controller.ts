import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, Req, Headers, RawBody } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { BookingEngineService } from './booking-engine.service';
import { PaymentsService } from '../payments/payments.service';
import { SearchAvailabilityDto, CreateBookingDto, VerifyPromoDto } from './dto';

@ApiTags('Booking Engine (Public)')
@Controller('book')
export class BookingEngineController {
  constructor(
    private readonly bookingSvc: BookingEngineService,
    private readonly paymentSvc: PaymentsService,
  ) {}

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get property info for booking page' })
  getProperty(@Param('slug') slug: string) {
    return this.bookingSvc.getPropertyInfo(slug);
  }

  @Public()
  @Post(':slug/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search available rooms and rates — main booking engine endpoint' })
  search(@Param('slug') slug: string, @Body() dto: SearchAvailabilityDto) {
    return this.bookingSvc.searchAvailability(slug, dto);
  }

  @Public()
  @Post(':slug/promo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify promotional code' })
  verifyPromo(@Param('slug') slug: string, @Body() dto: VerifyPromoDto) {
    return this.bookingSvc.verifyPromo(slug, dto);
  }

  @Public()
  @Post(':slug/reserve')
  @ApiOperation({ summary: 'Create booking with Stripe payment' })
  createBooking(@Param('slug') slug: string, @Body() dto: CreateBookingDto) {
    return this.bookingSvc.createBooking(slug, dto, this.paymentSvc);
  }

  @Public()
  @Get(':slug/booking/:confirmationNo')
  @ApiOperation({ summary: 'Get booking status by confirmation # + email' })
  getBooking(
    @Param('slug') slug: string,
    @Param('confirmationNo') confirmationNo: string,
    @Query('email') email: string,
  ) {
    return this.bookingSvc.getBooking(confirmationNo, email);
  }

  @Public()
  @Post(':slug/booking/:confirmationNo/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booking online with optional refund' })
  cancelBooking(
    @Param('slug') slug: string,
    @Param('confirmationNo') confirmationNo: string,
    @Body('email') email: string,
  ) {
    return this.bookingSvc.cancelBooking(confirmationNo, email, this.paymentSvc);
  }
}
