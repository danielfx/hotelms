import {
  IsString, IsOptional, IsNumber, IsEnum, IsPositive,
  IsDateString, IsInt, Min, Max, IsBoolean
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum BookingSourceEnum {
  DIRECT = 'DIRECT',
  BOOKING_COM = 'BOOKING_COM',
  EXPEDIA = 'EXPEDIA',
  AIRBNB = 'AIRBNB',
  PHONE = 'PHONE',
  WALK_IN = 'WALK_IN',
  GDS = 'GDS',
  CORPORATE = 'CORPORATE',
  OTA_OTHER = 'OTA_OTHER',
}

export enum ReservationStatusEnum {
  INQUIRY = 'INQUIRY',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export class CreateReservationDto {
  @ApiProperty({ example: 'clxxx-room-id' })
  @IsString()
  roomId: string;

  @ApiPropertyOptional({ description: 'Existing guest ID. If not provided, guestData is required.' })
  @IsOptional() @IsString()
  guestId?: string;

  @ApiPropertyOptional({ description: 'Create guest inline if no guestId' })
  @IsOptional()
  guestData?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    nationality?: string;
    passportNo?: string;
  };

  @ApiProperty({ example: '2025-03-15' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2025-03-18' })
  @IsDateString()
  checkOut: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional() @IsInt() @Min(1) @Max(20)
  adults?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsInt() @Min(0)
  children?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsInt() @Min(0)
  infants?: number;

  @ApiPropertyOptional({ enum: BookingSourceEnum, default: BookingSourceEnum.DIRECT })
  @IsOptional() @IsEnum(BookingSourceEnum)
  source?: BookingSourceEnum;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  ratePlanId?: string;

  @ApiPropertyOptional({ example: 129.00, description: 'Override base rate (optional)' })
  @IsOptional() @IsNumber() @IsPositive()
  rateOverride?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional() @IsString()
  eta?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  externalId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  channelId?: string;

  @ApiPropertyOptional({ example: 15, description: 'Commission percentage for OTA bookings' })
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  commissionPct?: number;
}

export class UpdateReservationDto {
  @IsOptional() @IsString() roomId?: string;
  @IsOptional() @IsDateString() checkIn?: string;
  @IsOptional() @IsDateString() checkOut?: string;
  @IsOptional() @IsInt() @Min(1) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() specialRequests?: string;
  @IsOptional() @IsString() internalNotes?: string;
  @IsOptional() @IsString() eta?: string;
  @IsOptional() @IsNumber() @IsPositive() rateOverride?: number;
}

export class CheckInDto {
  @ApiPropertyOptional({ description: 'Confirm or override room assignment' })
  @IsOptional() @IsString()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Passport/ID number verified at check-in' })
  @IsOptional() @IsString()
  passportNo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Charge deposit/first night at check-in' })
  @IsOptional() @IsBoolean()
  chargeDeposit?: boolean;

  @ApiPropertyOptional({ description: 'Payment method for deposit' })
  @IsOptional() @IsString()
  paymentMethod?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional({ description: 'Override check-out date (early/late checkout)' })
  @IsOptional() @IsDateString()
  checkOutDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  sendInvoiceEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}

export class CancelReservationDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Apply cancellation fee based on rate plan policy' })
  @IsOptional() @IsBoolean()
  applyFee?: boolean;
}

export class ReservationFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() checkIn?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() checkOut?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() q?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() roomId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() guestId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortDir?: string;
}

// ─── FOLIO DTOs ──────────────────────────────────────────────────────────────

export class AddChargeDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty({ example: 'Room 201 - Deluxe (2 nights)' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsInt() @Min(1)
  quantity: number;

  @ApiProperty({ example: 139.00 })
  @IsNumber() @IsPositive()
  unitPrice: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional() @IsNumber() @Min(0)
  taxRate?: number;
}

export class AddPaymentDto {
  @ApiProperty({ example: 278.00 })
  @IsNumber() @IsPositive()
  amount: number;

  @ApiProperty({ example: 'CREDIT_CARD' })
  @IsString()
  method: string;

  @ApiPropertyOptional({ example: '4242' })
  @IsOptional() @IsString()
  last4?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  cardBrand?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}
