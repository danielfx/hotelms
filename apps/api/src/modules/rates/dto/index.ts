import {
  IsString, IsNumber, IsOptional, IsEnum, IsBoolean,
  IsInt, Min, Max, IsArray, IsDateString
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RatePlanTypeEnum { PUBLIC='PUBLIC', MEMBER='MEMBER', CORPORATE='CORPORATE', OTA='OTA', PACKAGE='PACKAGE', PROMO='PROMO' }
export enum MealPlanEnum { ROOM_ONLY='ROOM_ONLY', BED_BREAKFAST='BED_BREAKFAST', HALF_BOARD='HALF_BOARD', FULL_BOARD='FULL_BOARD', ALL_INCLUSIVE='ALL_INCLUSIVE' }
export enum CancellationPolicyEnum { FREE='FREE', NON_REFUNDABLE='NON_REFUNDABLE', MODERATE='MODERATE', STRICT='STRICT' }

export class CreateRatePlanDto {
  @ApiProperty({ example: 'Best Available Rate' })
  @IsString() name: string;

  @ApiProperty({ example: 'BAR' })
  @IsString() code: string;

  @ApiPropertyOptional({ enum: RatePlanTypeEnum })
  @IsOptional() @IsEnum(RatePlanTypeEnum) type?: RatePlanTypeEnum;

  @ApiPropertyOptional()
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ enum: MealPlanEnum })
  @IsOptional() @IsEnum(MealPlanEnum) mealPlan?: MealPlanEnum;

  @ApiPropertyOptional({ enum: CancellationPolicyEnum })
  @IsOptional() @IsEnum(CancellationPolicyEnum) cancellationPolicy?: CancellationPolicyEnum;

  @ApiPropertyOptional({ example: 48 })
  @IsOptional() @IsInt() @Min(0) cancellationHours?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional() @IsNumber() @Min(0) @Max(100) cancellationPct?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt() @Min(1) minLOS?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(1) maxLOS?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsInt() @Min(0) minAdvance?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(0) maxAdvance?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean() isRefundable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean() availableOnline?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Markup % over base price' })
  @IsOptional() @IsNumber() @Min(0) markup?: number;

  @ApiPropertyOptional({ example: 15, description: 'Discount % off base price' })
  @IsOptional() @IsNumber() @Min(0) @Max(100) discount?: number;
}

export class UpdateRatePlanDto extends CreateRatePlanDto {}

export class SetDailyRateDto {
  @ApiProperty({ example: 'DLX' })
  @IsString() roomTypeCode: string;

  @ApiProperty({ example: '2025-03-15' })
  @IsDateString() date: string;

  @ApiProperty({ example: 159.00 })
  @IsNumber() @Min(0) price: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional() @IsInt() @Min(0) available?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(1) minLOS?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean() closed?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean() closedToArrival?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean() closedToDeparture?: boolean;
}

export class BulkUpdateRatesDto {
  @ApiProperty()
  @IsString() ratePlanId: string;

  @ApiProperty({ example: 'DLX' })
  @IsString() roomTypeCode: string;

  @ApiProperty({ example: '2025-03-01' })
  @IsDateString() dateFrom: string;

  @ApiProperty({ example: '2025-03-31' })
  @IsDateString() dateTo: string;

  @ApiProperty({ example: 159.00 })
  @IsNumber() @Min(0) price: number;

  @ApiPropertyOptional({ example: [1,2,3,4,5], description: 'Days of week (0=Sun, 6=Sat). Omit for all days.' })
  @IsOptional() @IsArray() @IsInt({ each: true }) daysOfWeek?: number[];

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(0) available?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean() closed?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean() closedToArrival?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean() closedToDeparture?: boolean;
}

export class GetRatesDto {
  @ApiPropertyOptional() @IsOptional() @IsString() roomTypeCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateTo?: string;
}

export class PriceQuoteDto {
  @ApiProperty() @IsString() roomTypeCode: string;
  @ApiProperty() @IsDateString() checkIn: string;
  @ApiProperty() @IsDateString() checkOut: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ratePlanId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) adults?: number;
}
