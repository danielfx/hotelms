import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyId } from '../../common/decorators/property.decorator';

@ApiTags('Onboarding & Help')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('progress')
  getProgress(@PropertyId() propertyId: string) {
    return this.onboardingService.getProgress(propertyId);
  }

  @Post('progress/:stepId')
  completeStep(@PropertyId() propertyId: string, @Param('stepId') stepId: string) {
    return this.onboardingService.completeStep(propertyId, stepId);
  }

  @Get('help')
  @ApiQuery({ name: 'category', required: false })
  listHelpArticles(@Query('category') category?: string) {
    return this.onboardingService.listHelpArticles(category);
  }

  @Get('help/search')
  @ApiQuery({ name: 'q', required: true })
  searchHelp(@Query('q') query: string) {
    return this.onboardingService.searchHelp(query);
  }

  @Get('help/:slug')
  getHelpArticle(@Param('slug') slug: string) {
    return this.onboardingService.getHelpArticle(slug);
  }
}
