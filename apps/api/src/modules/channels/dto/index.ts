import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChannelEnum {
  BOOKING_COM = 'BOOKING_COM',
  EXPEDIA = 'EXPEDIA',
  AIRBNB = 'AIRBNB',
  HOTELS_COM = 'HOTELS_COM',
  AGODA = 'AGODA',
  TRIP_COM = 'TRIP_COM',
  GDS_SABRE = 'GDS_SABRE',
  GDS_AMADEUS = 'GDS_AMADEUS',
  DIRECT = 'DIRECT',
}

export class ConnectChannelDto {
  @ApiProperty({ enum: ChannelEnum })
  @IsEnum(ChannelEnum)
  channel: ChannelEnum;

  @ApiProperty({ example: 'hotel-12345' })
  @IsString()
  externalHotelId: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  apiSecret?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  password?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  autoSync?: boolean;

  @ApiPropertyOptional({ example: 15, description: 'Commission % the OTA charges' })
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  commissionPct?: number;
}

export class UpdateChannelDto {
  @IsOptional() @IsBoolean() autoSync?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(100) commissionPct?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() apiKey?: string;
  @IsOptional() @IsString() apiSecret?: string;
}

export class SyncRatesDto {
  @ApiProperty({ example: '2025-03-01' })
  @IsDateString() dateFrom: string;

  @ApiProperty({ example: '2025-03-31' })
  @IsDateString() dateTo: string;

  @ApiPropertyOptional()
  @IsOptional() @IsArray() @IsString({ each: true })
  roomTypeCodes?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  ratePlanId?: string;
}

export class SyncInventoryDto {
  @ApiProperty()
  @IsDateString() dateFrom: string;

  @ApiProperty()
  @IsDateString() dateTo: string;

  @ApiPropertyOptional()
  @IsOptional() @IsArray() @IsString({ each: true })
  roomTypeCodes?: string[];
}
