import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';

@ApiTags('Audit & Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'page', required: false })
  searchLogs(
    @PropertyId() propertyId: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
  ) {
    return this.auditService.searchAuditLogs(propertyId, { action, userId, from, to, page: page ? parseInt(page) : 1 });
  }

  @Get('security')
  getSecurityDashboard(@PropertyId() propertyId: string) {
    return this.auditService.getSecurityDashboard(propertyId);
  }

  @Get('gdpr/export/:guestId')
  exportGuestData(@PropertyId() propertyId: string, @Param('guestId') guestId: string) {
    return this.auditService.exportGuestData(propertyId, guestId);
  }

  @Delete('gdpr/:guestId')
  deleteGuestData(@PropertyId() propertyId: string, @Param('guestId') guestId: string) {
    return this.auditService.deleteGuestData(propertyId, guestId);
  }

  @Get('permissions')
  getPermissionsMatrix(@PropertyId() propertyId: string) {
    return this.auditService.getPermissionsMatrix(propertyId);
  }
}
