import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, CreateReviewResponseDto, CreateSurveyDto, SubmitSurveyResponseDto } from './dto';

@Injectable()
export class ReputationService {
  constructor(private prisma: PrismaService) {}

  async listReviews(propertyId: string, source?: string) {
    const where: any = { propertyId };
    if (source) where.source = source;
    return this.prisma.review.findMany({ where, include: { responses: true }, orderBy: { createdAt: 'desc' } });
  }

  async getReviewStats(propertyId: string) {
    const reviews = await this.prisma.review.findMany({ where: { propertyId }, select: { rating: true, source: true, sentiment: true } });
    const total = reviews.length;
    const avgRating = total > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;
    const bySource: Record<string, { count: number; avgRating: number }> = {};
    reviews.forEach(r => {
      if (!bySource[r.source]) bySource[r.source] = { count: 0, avgRating: 0 };
      bySource[r.source].count++;
      bySource[r.source].avgRating += r.rating;
    });
    Object.keys(bySource).forEach(k => { bySource[k].avgRating = Math.round((bySource[k].avgRating / bySource[k].count) * 10) / 10; });
    const sentimentBreakdown = {
      positive: reviews.filter(r => r.sentiment === 'POSITIVE').length,
      neutral: reviews.filter(r => r.sentiment === 'NEUTRAL').length,
      negative: reviews.filter(r => r.sentiment === 'NEGATIVE').length,
    };
    return { total, avgRating, bySource, sentimentBreakdown };
  }

  async createReview(propertyId: string, dto: CreateReviewDto) {
    const sentiment = dto.rating >= 4 ? 'POSITIVE' : dto.rating >= 3 ? 'NEUTRAL' : 'NEGATIVE';
    const sentimentScore = (dto.rating - 3) / 2;
    return this.prisma.review.create({
      data: { ...dto, propertyId, source: dto.source as any, sentiment, sentimentScore, publishedAt: new Date() },
    });
  }

  async respondToReview(reviewId: string, propertyId: string, dto: CreateReviewResponseDto, userId: string) {
    const review = await this.prisma.review.findFirst({ where: { id: reviewId, propertyId } });
    if (!review) throw new NotFoundException('Review not found');
    return this.prisma.reviewResponse.create({
      data: { reviewId, body: dto.body, isPublic: dto.isPublic ?? true, postedBy: userId, postedAt: new Date() },
    });
  }

  async listSurveys(propertyId: string) {
    return this.prisma.guestSurvey.findMany({
      where: { propertyId }, include: { _count: { select: { responses: true } } }, orderBy: { createdAt: 'desc' },
    });
  }

  async createSurvey(propertyId: string, dto: CreateSurveyDto) {
    return this.prisma.guestSurvey.create({ data: { ...dto, questions: dto.questions as any, propertyId } });
  }

  async getSurvey(id: string, propertyId: string) {
    const survey = await this.prisma.guestSurvey.findFirst({
      where: { id, propertyId }, include: { responses: { take: 50, orderBy: { createdAt: 'desc' } } },
    });
    if (!survey) throw new NotFoundException('Survey not found');
    return survey;
  }

  async submitSurveyResponse(surveyId: string, dto: SubmitSurveyResponseDto) {
    const survey = await this.prisma.guestSurvey.findFirst({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Survey not found');
    return this.prisma.surveyResponse.create({
      data: { surveyId, guestEmail: dto.guestEmail, answers: dto.answers as any, overallScore: dto.overallScore },
    });
  }

  async getSurveyAnalytics(id: string, propertyId: string) {
    const survey = await this.prisma.guestSurvey.findFirst({ where: { id, propertyId }, include: { responses: true } });
    if (!survey) throw new NotFoundException('Survey not found');
    const responses = survey.responses;
    const scored = responses.filter(r => r.overallScore);
    const avgScore = scored.length > 0 ? Math.round((scored.reduce((s, r) => s + (r.overallScore || 0), 0) / scored.length) * 10) / 10 : 0;
    return { surveyId: id, totalResponses: responses.length, avgScore };
  }
}
