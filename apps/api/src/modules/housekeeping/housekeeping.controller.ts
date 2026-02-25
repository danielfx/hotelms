import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HousekeepingService } from './housekeeping.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Housekeeping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly svc: HousekeepingService) {}

  @Get('tasks')
  @ApiOperation({ summary: 'Get tasks grouped by floor with stats' })
  getTasks(@PropertyId() pid: string, @Query() filter: any) { return this.svc.getTasks(pid, filter); }

  @Post('tasks')
  createTask(@PropertyId() pid: string, @Body() dto: any) { return this.svc.createTask(pid, dto); }

  @Post('tasks/:id/assign')
  @HttpCode(HttpStatus.OK)
  assign(@Param('id') id: string, @PropertyId() pid: string, @Body('attendantId') attendantId: string) {
    return this.svc.assignTask(id, pid, attendantId);
  }

  @Post('tasks/:id/start')
  @HttpCode(HttpStatus.OK)
  start(@Param('id') id: string, @CurrentUser() user: any) { return this.svc.startTask(id, user.id); }

  @Post('tasks/:id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.svc.completeTask(id, user.id, dto);
  }

  @Post('tasks/:id/inspect')
  @HttpCode(HttpStatus.OK)
  inspect(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.svc.inspectRoom(id, user.id, dto);
  }

  @Post('schedule/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-generate daily HK schedule from reservations' })
  generate(@PropertyId() pid: string, @Body('date') date: string) {
    return this.svc.generateDailySchedule(pid, date ?? new Date().toISOString().split('T')[0]);
  }

  @Get('attendants')
  getAttendants(@PropertyId() pid: string) { return this.svc.getAttendants(pid); }

  @Get('stats')
  getStats(@PropertyId() pid: string) { return this.svc.getStats(pid); }

  @Get('maintenance')
  getMaintenance(@PropertyId() pid: string, @Query() filter: any) { return this.svc.getMaintenanceLogs(pid, filter); }

  @Post('maintenance')
  createMaintenance(@PropertyId() pid: string, @Body() dto: any) { return this.svc.createMaintenanceLog(pid, dto); }

  @Post('maintenance/:id/resolve')
  @HttpCode(HttpStatus.OK)
  resolveMaintenance(@Param('id') id: string, @PropertyId() pid: string, @Body('resolution') resolution: string, @CurrentUser() user: any) {
    return this.svc.resolveMaintenanceLog(id, pid, resolution, user.id);
  }
}
