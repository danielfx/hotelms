import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { ConnectChannelDto, UpdateChannelDto, SyncRatesDto, SyncInventoryDto } from './dto';

@ApiTags('Channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly svc: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: 'List all OTA channel connections with stats' })
  findAll(@PropertyId() pid: string) {
    return this.svc.findAll(pid);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @PropertyId() pid: string) {
    return this.svc.findOne(id, pid);
  }

  @Post('connect')
  @Roles('SUPER_ADMIN','PROPERTY_OWNER','GENERAL_MANAGER')
  @ApiOperation({ summary: 'Connect a new OTA channel (validates credentials)' })
  connect(@PropertyId() pid: string, @Body() dto: ConnectChannelDto) {
    return this.svc.connect(pid, dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN','PROPERTY_OWNER','GENERAL_MANAGER')
  update(@Param('id') id: string, @PropertyId() pid: string, @Body() dto: UpdateChannelDto) {
    return this.svc.update(id, pid, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN','PROPERTY_OWNER','GENERAL_MANAGER')
  disconnect(@Param('id') id: string, @PropertyId() pid: string) {
    return this.svc.disconnect(id, pid);
  }

  @Post(':id/sync/rates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Push rates to channel for date range' })
  syncRates(@Param('id') id: string, @PropertyId() pid: string, @Body() dto: SyncRatesDto) {
    return this.svc.syncRates(id, pid, dto);
  }

  @Post(':id/sync/inventory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Push real-time inventory counts to channel' })
  syncInventory(@Param('id') id: string, @PropertyId() pid: string, @Body() dto: SyncInventoryDto) {
    return this.svc.syncInventory(id, pid, dto);
  }

  @Post(':id/pull/reservations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pull new/modified reservations from channel' })
  pullReservations(@Param('id') id: string, @PropertyId() pid: string) {
    return this.svc.pullReservations(id, pid);
  }

  @Post('sync-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync rates + inventory to all active channels' })
  syncAll(@PropertyId() pid: string) {
    return this.svc.syncAll(pid);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get sync logs for a channel' })
  getLogs(@Param('id') id: string, @PropertyId() pid: string, @Query('limit') limit?: number) {
    return this.svc.getSyncLogs(id, pid, limit);
  }
}
