import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty() @IsString() source: string;
  @ApiPropertyOptional() @IsOptional() @IsString() externalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() guestName?: string;
  @ApiProperty() @IsNumber() rating: number;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() categories?: string[];
}

export class CreateReviewResponseDto {
  @ApiProperty() @IsString() body: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
}

export class CreateSurveyDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() questions: any[];
}

export class SubmitSurveyResponseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() guestEmail?: string;
  @ApiProperty() answers: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsNumber() overallScore?: number;
}
