import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CreateGroupDto, UpdateGroupDto, CreateGroupBlockDto, CreateRoomingListEntryDto, CreateEventSpaceDto, CreateEventBookingDto } from './dto';

@ApiTags('Groups & Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiQuery({ name: 'status', required: false })
  listGroups(@PropertyId() propertyId: string, @Query('status') status?: string) {
    return this.groupsService.listGroups(propertyId, status);
  }

  @Get(':id')
  getGroup(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.groupsService.getGroup(id, propertyId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'GROUP_COORDINATOR')
  createGroup(@PropertyId() propertyId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(propertyId, dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'GROUP_COORDINATOR')
  updateGroup(@Param('id') id: string, @PropertyId() propertyId: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.updateGroup(id, propertyId, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  deleteGroup(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.groupsService.deleteGroup(id, propertyId);
  }

  @Post(':id/blocks')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'GROUP_COORDINATOR')
  addBlock(@Param('id') groupId: string, @PropertyId() propertyId: string, @Body() dto: CreateGroupBlockDto) {
    return this.groupsService.addBlock(groupId, propertyId, dto);
  }

  @Delete('blocks/:blockId')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'GROUP_COORDINATOR')
  removeBlock(@Param('blockId') blockId: string) {
    return this.groupsService.removeBlock(blockId);
  }

  @Post(':id/rooming')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'GROUP_COORDINATOR')
  addRoomingEntry(@Param('id') groupId: string, @PropertyId() propertyId: string, @Body() dto: CreateRoomingListEntryDto) {
    return this.groupsService.addRoomingEntry(groupId, propertyId, dto);
  }

  @Delete('rooming/:entryId')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'GROUP_COORDINATOR')
  deleteRoomingEntry(@Param('entryId') entryId: string) {
    return this.groupsService.deleteRoomingEntry(entryId);
  }

  @Get('events/spaces')
  listEventSpaces(@PropertyId() propertyId: string) {
    return this.groupsService.listEventSpaces(propertyId);
  }

  @Post('events/spaces')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'FB_MANAGER')
  createEventSpace(@PropertyId() propertyId: string, @Body() dto: CreateEventSpaceDto) {
    return this.groupsService.createEventSpace(propertyId, dto);
  }

  @Get('events/bookings')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  listEventBookings(@PropertyId() propertyId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.groupsService.listEventBookings(propertyId, from, to);
  }

  @Post('events/bookings')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'FB_MANAGER', 'GROUP_COORDINATOR')
  createEventBooking(@Body() dto: CreateEventBookingDto) {
    return this.groupsService.createEventBooking(dto);
  }
}
