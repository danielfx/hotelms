import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CreateRoomDto, UpdateRoomDto, UpdateRoomStatusDto, RoomFilterDto, CreateRoomTypeDto } from './dto';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // ─── ROOM TYPES ────────────────────────────────────────────────────────────

  @Get('types')
  @ApiOperation({ summary: 'List all room types for property' })
  findAllTypes(@PropertyId() propertyId: string) {
    return this.roomsService.findAllTypes(propertyId);
  }

  @Post('types')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  @ApiOperation({ summary: 'Create a new room type' })
  createType(@PropertyId() propertyId: string, @Body() dto: CreateRoomTypeDto) {
    return this.roomsService.createType(propertyId, dto);
  }

  @Patch('types/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  updateType(@Param('id') id: string, @PropertyId() propertyId: string, @Body() dto: Partial<CreateRoomTypeDto>) {
    return this.roomsService.updateType(id, propertyId, dto);
  }

  @Delete('types/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  deleteType(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.roomsService.deleteType(id, propertyId);
  }

  // ─── AVAILABILITY ─────────────────────────────────────────────────────────

  @Get('availability')
  @ApiOperation({ summary: 'Check room availability for date range' })
  @ApiQuery({ name: 'checkIn', required: true, example: '2025-03-01' })
  @ApiQuery({ name: 'checkOut', required: true, example: '2025-03-05' })
  @ApiQuery({ name: 'roomTypeId', required: false })
  getAvailability(
    @PropertyId() propertyId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('roomTypeId') roomTypeId?: string,
  ) {
    return this.roomsService.getAvailability(propertyId, checkIn, checkOut, roomTypeId);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Get occupancy statistics' })
  getOccupancy(@PropertyId() propertyId: string, @Query('date') date?: string) {
    return this.roomsService.getOccupancyStats(propertyId, date);
  }

  // ─── ROOMS CRUD ───────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all rooms with filters' })
  findAll(@PropertyId() propertyId: string, @Query() filter: RoomFilterDto) {
    return this.roomsService.findAll(propertyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room details with reservations and tasks' })
  findOne(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.roomsService.findOne(id, propertyId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  @ApiOperation({ summary: 'Create a new room' })
  create(@PropertyId() propertyId: string, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(propertyId, dto);
  }

  @Post('bulk')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  @ApiOperation({ summary: 'Bulk create rooms' })
  bulkCreate(@PropertyId() propertyId: string, @Body() body: { rooms: CreateRoomDto[] }) {
    return this.roomsService.bulkCreate(propertyId, body.rooms);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Update room details' })
  update(@Param('id') id: string, @PropertyId() propertyId: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, propertyId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update room status (available, occupied, cleaning, maintenance)' })
  updateStatus(
    @Param('id') id: string,
    @PropertyId() propertyId: string,
    @Body() dto: UpdateRoomStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.roomsService.updateStatus(id, propertyId, dto, user.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a room (must not be occupied or have active reservations)' })
  delete(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.roomsService.delete(id, propertyId);
  }
}
