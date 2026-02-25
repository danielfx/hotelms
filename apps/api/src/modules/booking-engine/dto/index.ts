import {
  IsString, IsOptional, IsEnum, IsNumber, IsInt,
  IsDateString, Min, Max, IsEmail, IsBoolean, IsArray
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchAvailabilityDto {
  @ApiProperty({ example: '2025-03-15' })
  @IsDateString() checkIn: string;

  @ApiProperty({ example: '2025-03-18' })
  @IsDateString() checkOut: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional() @IsInt() @Min(1) @Max(20) adults?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsInt() @Min(0) children?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() promoCode?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() currency?: string;
}

export class CreateBookingDto {
  @ApiProperty() @IsString() propertySlug: string;
  @ApiProperty() @IsString() roomTypeCode: string;
  @ApiProperty() @IsString() ratePlanId: string;
  @ApiProperty() @IsDateString() checkIn: string;
  @ApiProperty() @IsDateString() checkOut: string;
  @ApiProperty() @IsInt() @Min(1) adults: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) children?: number;

  // Guest info
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nationality?: string;

  // Payment
  @ApiProperty({ example: 'pm_xxxx', description: 'Stripe PaymentMethod ID' })
  @IsString() paymentMethodId: string;

  @ApiPropertyOptional() @IsOptional() @IsString() specialRequests?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() promoCode?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() acceptMarketing?: boolean;
}

export class VerifyPromoDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() ratePlanId: string;
}

// ─── PAYMENTS DTOs ────────────────────────────────────────────────────────────

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 29800, description: 'Amount in cents' })
  @IsInt() @Min(50) amount: number;

  @ApiPropertyOptional({ default: 'usd' })
  @IsOptional() @IsString() currency?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() reservationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty() @IsString() paymentIntentId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reservationId?: string;
}

export class RefundPaymentDto {
  @ApiProperty() @IsString() paymentId: string;
  @ApiPropertyOptional({ description: 'Amount in cents. Full refund if omitted.' })
  @IsOptional() @IsInt() @Min(1) amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
