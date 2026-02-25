import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'PROPERTY_OWNER')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get multi-property dashboard' })
  getDashboard(@CurrentUser() user: any) {
    return this.portfolioService.getDashboard(user.id);
  }

  @Get('kpis')
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getKPIs(@CurrentUser() user: any, @Query('from') from: string, @Query('to') to: string) {
    return this.portfolioService.getCrossPropertyKPIs(user.id, from, to);
  }

  @Get('report')
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getReport(@CurrentUser() user: any, @Query('from') from: string, @Query('to') to: string) {
    return this.portfolioService.getConsolidatedReport(user.id, from, to);
  }
}
