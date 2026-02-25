import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { UpdatePropertyDto, UpdatePropertySettingsDto } from './dto';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all properties' })
  findAll() {
    return this.propertiesService.listAll();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current property details' })
  findCurrent(@PropertyId() propertyId: string) {
    return this.propertiesService.findOne(propertyId);
  }

  @Patch('current')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  @ApiOperation({ summary: 'Update current property' })
  update(@PropertyId() propertyId: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(propertyId, dto);
  }

  @Patch('current/settings')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  @ApiOperation({ summary: 'Update property settings' })
  updateSettings(@PropertyId() propertyId: string, @Body() dto: UpdatePropertySettingsDto) {
    return this.propertiesService.updateSettings(propertyId, dto);
  }

  @Get('current/stats')
  @ApiOperation({ summary: 'Get property statistics' })
  getStats(@PropertyId() propertyId: string) {
    return this.propertiesService.getStats(propertyId);
  }
}
