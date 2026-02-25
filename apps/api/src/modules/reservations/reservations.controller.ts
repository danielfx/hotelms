import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, Req
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import {
  CreateReservationDto, UpdateReservationDto, CheckInDto,
  CheckOutDto, CancelReservationDto, ReservationFilterDto
} from './dto';

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly svc: ReservationsService) {}

  // ─── DASHBOARDS ───────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'PMS dashboard stats: arrivals, departures, occupancy, revenue' })
  getDashboard(@PropertyId() propertyId: string) {
    return this.svc.getDashboardStats(propertyId);
  }

  @Get('arrivals')
  @ApiOperation({ summary: 'Today\'s (or given date) arrivals' })
  @ApiQuery({ name: 'date', required: false, example: '2025-03-15' })
  getArrivals(@PropertyId() pid: string, @Query('date') date?: string) {
    return this.svc.getArrivals(pid, date ?? new Date().toISOString().split('T')[0]);
  }

  @Get('departures')
  @ApiOperation({ summary: 'Today\'s (or given date) departures' })
  @ApiQuery({ name: 'date', required: false })
  getDepartures(@PropertyId() pid: string, @Query('date') date?: string) {
    return this.svc.getDepartures(pid, date ?? new Date().toISOString().split('T')[0]);
  }

  @Get('in-house')
  @ApiOperation({ summary: 'All currently checked-in guests' })
  getInHouse(@PropertyId() pid: string) {
    return this.svc.getInHouse(pid);
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List reservations with filters and pagination' })
  findAll(@PropertyId() pid: string, @Query() filter: ReservationFilterDto) {
    return this.svc.findAll(pid, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full reservation details with folio and payments' })
  findOne(@Param('id') id: string, @PropertyId() pid: string) {
    return this.svc.findOne(id, pid);
  }

  @Post()
  @ApiOperation({ summary: 'Create reservation (availability check + folio auto-created)' })
  create(
    @PropertyId() pid: string,
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.create(pid, dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify reservation dates, room, or notes' })
  update(
    @Param('id') id: string,
    @PropertyId() pid: string,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.update(id, pid, dto, user.id);
  }

  // ─── OPERATIONS ───────────────────────────────────────────────────────────

  @Post(':id/checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in guest — marks room OCCUPIED, updates folio' })
  checkIn(
    @Param('id') id: string,
    @PropertyId() pid: string,
    @Body() dto: CheckInDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.checkIn(id, pid, dto, user.id);
  }

  @Post(':id/checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check out guest — requires settled folio, triggers HK task' })
  checkOut(
    @Param('id') id: string,
    @PropertyId() pid: string,
    @Body() dto: CheckOutDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.checkOut(id, pid, dto, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel reservation with optional cancellation fee' })
  cancel(
    @Param('id') id: string,
    @PropertyId() pid: string,
    @Body() dto: CancelReservationDto,
    @CurrentUser() user: any,
  ) {
    return this.svc.cancel(id, pid, dto, user.id);
  }

  @Post(':id/no-show')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'GENERAL_MANAGER', 'FRONT_DESK', 'NIGHT_AUDITOR')
  @ApiOperation({ summary: 'Mark reservation as no-show, frees room' })
  noShow(
    @Param('id') id: string,
    @PropertyId() pid: string,
    @CurrentUser() user: any,
  ) {
    return this.svc.markNoShow(id, pid, user.id);
  }
}
