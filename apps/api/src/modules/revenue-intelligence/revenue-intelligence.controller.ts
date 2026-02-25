import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RevenueIntelligenceService } from './revenue-intelligence.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CreatePricingRuleDto, UpdatePricingRuleDto } from './dto';

@ApiTags('Revenue Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('revenue')
export class RevenueIntelligenceController {
  constructor(private readonly revenueService: RevenueIntelligenceService) {}

  @Get('rules')
  @ApiOperation({ summary: 'List pricing rules' })
  listRules(@PropertyId() propertyId: string) {
    return this.revenueService.listRules(propertyId);
  }

  @Post('rules')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  createRule(@PropertyId() propertyId: string, @Body() dto: CreatePricingRuleDto) {
    return this.revenueService.createRule(propertyId, dto);
  }

  @Patch('rules/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  updateRule(@Param('id') id: string, @PropertyId() propertyId: string, @Body() dto: UpdatePricingRuleDto) {
    return this.revenueService.updateRule(id, propertyId, dto);
  }

  @Delete('rules/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  deleteRule(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.revenueService.deleteRule(id, propertyId);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Get demand forecast' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getForecast(@PropertyId() propertyId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.revenueService.getForecast(propertyId, from, to);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get rate recommendations' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getRecommendations(@PropertyId() propertyId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.revenueService.getRecommendations(propertyId, from, to);
  }

  @Post('recommendations/:id/apply')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'REVENUE_MANAGER')
  applyRecommendation(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.revenueService.applyRecommendation(id, propertyId);
  }

  @Get('competitors')
  @ApiOperation({ summary: 'Get competitor analysis (mock)' })
  getCompetitors(@PropertyId() propertyId: string) {
    return this.revenueService.getCompetitorAnalysis(propertyId);
  }
}
