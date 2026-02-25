import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RatesService } from './rates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import {
  CreateRatePlanDto, UpdateRatePlanDto, SetDailyRateDto,
  BulkUpdateRatesDto, GetRatesDto, PriceQuoteDto
} from './dto';

@ApiTags('Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rates')
export class RatesController {
  constructor(private readonly svc: RatesService) {}

  // ─── RATE PLANS ───────────────────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'List all rate plans' })
  findAllPlans(@PropertyId() pid: string) {
    return this.svc.findAllPlans(pid);
  }

  @Get('plans/:id')
  findOnePlan(@Param('id') id: string, @PropertyId() pid: string) {
    return this.svc.findOnePlan(id, pid);
  }

  @Post('plans')
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  @ApiOperation({ summary: 'Create rate plan' })
  createPlan(@PropertyId() pid: string, @Body() dto: CreateRatePlanDto) {
    return this.svc.createPlan(pid, dto);
  }

  @Patch('plans/:id')
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  updatePlan(@Param('id') id: string, @PropertyId() pid: string, @Body() dto: UpdateRatePlanDto) {
    return this.svc.updatePlan(id, pid, dto);
  }

  @Delete('plans/:id')
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  deactivatePlan(@Param('id') id: string, @PropertyId() pid: string) {
    return this.svc.deactivatePlan(id, pid);
  }

  @Post('plans/:id/duplicate')
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  @ApiOperation({ summary: 'Clone a rate plan with new code and name' })
  duplicatePlan(
    @Param('id') id: string,
    @PropertyId() pid: string,
    @Body() body: { code: string; name: string },
  ) {
    return this.svc.duplicatePlan(id, pid, body.code, body.name);
  }

  // ─── DAILY RATES ──────────────────────────────────────────────────────────

  @Get('plans/:id/daily')
  @ApiOperation({ summary: 'Get daily rates grid for a plan' })
  getDailyRates(@Param('id') id: string, @PropertyId() pid: string, @Query() filter: GetRatesDto) {
    return this.svc.getDailyRates(id, pid, filter);
  }

  @Post('plans/:id/daily')
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  @ApiOperation({ summary: 'Set/override rate for a specific date and room type' })
  setDailyRate(@Param('id') id: string, @PropertyId() pid: string, @Body() dto: SetDailyRateDto) {
    return this.svc.setDailyRate(id, pid, dto);
  }

  @Post('bulk-update')
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update rates for a date range with optional day-of-week filter' })
  bulkUpdate(@PropertyId() pid: string, @Body() dto: BulkUpdateRatesDto) {
    return this.svc.bulkUpdateRates(pid, dto);
  }

  // ─── PRICE ENGINE ─────────────────────────────────────────────────────────

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get price quotes across all rate plans for a date range + room type' })
  getPriceQuote(@PropertyId() pid: string, @Body() dto: PriceQuoteDto) {
    return this.svc.getPriceQuote(pid, dto);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Full rate calendar grid: all plans × room types × dates' })
  getCalendar(
    @PropertyId() pid: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.svc.getRateCalendar(pid, dateFrom, dateTo);
  }

  @Get('demand')
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  @ApiOperation({ summary: 'Daily occupancy demand stats for pricing decisions' })
  getDemand(
    @PropertyId() pid: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.svc.getDemandStats(pid, dateFrom, dateTo);
  }
}
