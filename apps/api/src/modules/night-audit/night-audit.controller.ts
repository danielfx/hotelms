import { Controller, Post, Get, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NightAuditService } from './night-audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';

@ApiTags('Night Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('night-audit')
export class NightAuditController {
  constructor(private readonly svc: NightAuditService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN','GENERAL_MANAGER','NIGHT_AUDITOR','ACCOUNTANT')
  @ApiOperation({ summary: 'Run full night audit: no-shows, room charges, HK plan, stats' })
  run(@PropertyId() pid: string, @Body('date') date: string, @CurrentUser() user: any) {
    return this.svc.runAudit(pid, date ?? new Date().toISOString().split('T')[0], user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get past night audit reports' })
  history(@PropertyId() pid: string, @Query('limit') limit?: number) {
    return this.svc.getAuditHistory(pid, limit);
  }
}
