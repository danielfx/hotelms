import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GuestsService } from './guests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CreateGuestDto, UpdateGuestDto, GuestFilterDto } from './dto';

@ApiTags('Guests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Quick search guests by name, email, phone' })
  search(@PropertyId() propertyId: string, @Query('q') q: string) {
    return this.guestsService.search(propertyId, q);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Guest statistics dashboard' })
  getStats(@PropertyId() propertyId: string) {
    return this.guestsService.getStats(propertyId);
  }

  @Get()
  @ApiOperation({ summary: 'List all guests with filters and pagination' })
  findAll(@PropertyId() propertyId: string, @Query() filter: GuestFilterDto) {
    return this.guestsService.findAll(propertyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get guest profile with stay history' })
  findOne(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.guestsService.findOne(id, propertyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new guest profile' })
  create(@PropertyId() propertyId: string, @Body() dto: CreateGuestDto) {
    return this.guestsService.create(propertyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update guest profile' })
  update(@Param('id') id: string, @PropertyId() propertyId: string, @Body() dto: UpdateGuestDto) {
    return this.guestsService.update(id, propertyId, dto);
  }

  @Patch(':id/vip')
  @ApiOperation({ summary: 'Toggle VIP status' })
  toggleVip(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.guestsService.toggleVip(id, propertyId);
  }

  @Patch(':id/blacklist')
  @ApiOperation({ summary: 'Toggle blacklist status' })
  toggleBlacklist(@Param('id') id: string, @PropertyId() propertyId: string, @Body('reason') reason?: string) {
    return this.guestsService.toggleBlacklist(id, propertyId, reason);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge duplicate guest profiles' })
  merge(@Body() body: { primaryId: string; duplicateId: string }, @PropertyId() propertyId: string) {
    return this.guestsService.merge(body.primaryId, body.duplicateId, propertyId);
  }
}
