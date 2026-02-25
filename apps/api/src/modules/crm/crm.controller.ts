import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CreateSegmentDto, CreateCampaignDto, UpdateCampaignDto } from './dto';

@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('segments')
  @ApiOperation({ summary: 'List guest segments' })
  listSegments(@PropertyId() propertyId: string) {
    return this.crmService.listSegments(propertyId);
  }

  @Post('segments')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'MARKETING_MANAGER')
  @ApiOperation({ summary: 'Create a guest segment' })
  createSegment(@PropertyId() propertyId: string, @Body() dto: CreateSegmentDto) {
    return this.crmService.createSegment(propertyId, dto);
  }

  @Patch('segments/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'MARKETING_MANAGER')
  updateSegment(@Param('id') id: string, @PropertyId() propertyId: string, @Body() dto: Partial<CreateSegmentDto>) {
    return this.crmService.updateSegment(id, propertyId, dto);
  }

  @Delete('segments/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'MARKETING_MANAGER')
  deleteSegment(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.crmService.deleteSegment(id, propertyId);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List email campaigns' })
  listCampaigns(@PropertyId() propertyId: string) {
    return this.crmService.listCampaigns(propertyId);
  }

  @Get('campaigns/:id')
  getCampaign(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.crmService.getCampaign(id, propertyId);
  }

  @Post('campaigns')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'MARKETING_MANAGER')
  createCampaign(@PropertyId() propertyId: string, @Body() dto: CreateCampaignDto) {
    return this.crmService.createCampaign(propertyId, dto);
  }

  @Patch('campaigns/:id')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'MARKETING_MANAGER')
  updateCampaign(@Param('id') id: string, @PropertyId() propertyId: string, @Body() dto: UpdateCampaignDto) {
    return this.crmService.updateCampaign(id, propertyId, dto);
  }

  @Post('campaigns/:id/send')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'MARKETING_MANAGER')
  sendCampaign(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.crmService.sendCampaign(id, propertyId);
  }

  @Get('campaigns/:id/analytics')
  getCampaignAnalytics(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.crmService.getCampaignAnalytics(id, propertyId);
  }
}
