import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReputationService } from './reputation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PropertyId } from '../../common/decorators/property.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateReviewDto, CreateReviewResponseDto, CreateSurveyDto, SubmitSurveyResponseDto } from './dto';

@ApiTags('Reputation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('reviews')
  @ApiOperation({ summary: 'List reviews' })
  @ApiQuery({ name: 'source', required: false })
  listReviews(@PropertyId() propertyId: string, @Query('source') source?: string) {
    return this.reputationService.listReviews(propertyId, source);
  }

  @Get('reviews/stats')
  @ApiOperation({ summary: 'Get review statistics' })
  getReviewStats(@PropertyId() propertyId: string) {
    return this.reputationService.getReviewStats(propertyId);
  }

  @Post('reviews')
  createReview(@PropertyId() propertyId: string, @Body() dto: CreateReviewDto) {
    return this.reputationService.createReview(propertyId, dto);
  }

  @Post('reviews/:id/respond')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER')
  respondToReview(@Param('id') id: string, @PropertyId() propertyId: string, @Body() dto: CreateReviewResponseDto, @CurrentUser() user: any) {
    return this.reputationService.respondToReview(id, propertyId, dto, user.id);
  }

  @Get('surveys')
  listSurveys(@PropertyId() propertyId: string) {
    return this.reputationService.listSurveys(propertyId);
  }

  @Post('surveys')
  @Roles('SUPER_ADMIN', 'PROPERTY_OWNER', 'GENERAL_MANAGER', 'MARKETING_MANAGER')
  createSurvey(@PropertyId() propertyId: string, @Body() dto: CreateSurveyDto) {
    return this.reputationService.createSurvey(propertyId, dto);
  }

  @Get('surveys/:id')
  getSurvey(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.reputationService.getSurvey(id, propertyId);
  }

  @Post('surveys/:id/respond')
  @Public()
  submitSurveyResponse(@Param('id') id: string, @Body() dto: SubmitSurveyResponseDto) {
    return this.reputationService.submitSurveyResponse(id, dto);
  }

  @Get('surveys/:id/analytics')
  getSurveyAnalytics(@Param('id') id: string, @PropertyId() propertyId: string) {
    return this.reputationService.getSurveyAnalytics(id, propertyId);
  }
}
