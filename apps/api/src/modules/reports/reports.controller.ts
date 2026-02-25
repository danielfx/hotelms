import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboard(@PropertyId() propertyId: string) {
    return this.reportsService.getDashboard(propertyId);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Get occupancy report for date range' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getOccupancy(@PropertyId() propertyId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getOccupancyReport(propertyId, from, to);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report for date range' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getRevenue(@PropertyId() propertyId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getRevenueReport(propertyId, from, to);
  }

  @Get('arrivals')
  @ApiOperation({ summary: 'Get arrivals for a specific date' })
  @ApiQuery({ name: 'date', required: true })
  getArrivals(@PropertyId() propertyId: string, @Query('date') date: string) {
    return this.reportsService.getArrivalsReport(propertyId, date);
  }

  @Get('departures')
  @ApiOperation({ summary: 'Get departures for a specific date' })
  @ApiQuery({ name: 'date', required: true })
  getDepartures(@PropertyId() propertyId: string, @Query('date') date: string) {
    return this.reportsService.getDeparturesReport(propertyId, date);
  }

  @Get('night-audit')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'NIGHT_AUDITOR')
  @ApiOperation({ summary: 'Get night audit summary for a date' })
  @ApiQuery({ name: 'date', required: true })
  getNightAudit(@PropertyId() propertyId: string, @Query('date') date: string) {
    return this.reportsService.getNightAuditSummary(propertyId, date);
  }

  // ─── USALI ──────────────────────────────────────────────────────────────────

  @Get('usali')
  @ApiOperation({ summary: 'Get USALI summary operating statement' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getUsali(@PropertyId() propertyId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getUsaliReport(propertyId, from, to);
  }

  @Get('usali/expenses')
  @ApiOperation({ summary: 'List department expenses' })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'department', required: false })
  getUsaliExpenses(
    @PropertyId() propertyId: string,
    @Query('month') month?: string,
    @Query('department') department?: string,
  ) {
    return this.reportsService.getUsaliExpenses(propertyId, month, department);
  }

  @Post('usali/expenses')
  @ApiOperation({ summary: 'Add a department expense' })
  addUsaliExpense(@PropertyId() propertyId: string, @Body() body: { department: string; category: string; description: string; amount: number; month: string }) {
    return this.reportsService.addUsaliExpense(propertyId, body);
  }

  @Delete('usali/expenses/:id')
  @ApiOperation({ summary: 'Delete a department expense' })
  async deleteUsaliExpense(@PropertyId() propertyId: string, @Param('id') id: string) {
    try {
      return await this.reportsService.deleteUsaliExpense(propertyId, id);
    } catch {
      throw new NotFoundException('Expense not found');
    }
  }
}
