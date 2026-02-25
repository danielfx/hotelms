import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, IsPositive, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RoomStatusEnum {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  INSPECTING = 'INSPECTING',
}

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Deluxe Room' })
  @IsString() @MinLength(2)
  name: string;

  @ApiProperty({ example: 'DLX' })
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 2 })
  @IsNumber() @IsPositive() @Max(20)
  capacity: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  extraBedCapacity?: number;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional() @IsNumber() @IsPositive()
  squareMeters?: number;

  @ApiPropertyOptional({ example: 'King' })
  @IsOptional() @IsString()
  bedType?: string;

  @ApiProperty({ example: ['WiFi', 'AC', 'TV'] })
  @IsArray() @IsString({ each: true })
  amenities: string[];

  @ApiPropertyOptional({ example: [] })
  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @ApiProperty({ example: 129.00 })
  @IsNumber() @IsPositive()
  basePrice: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsNumber() @Min(0)
  sortOrder?: number;
}

export class CreateRoomDto {
  @ApiProperty({ example: '201' })
  @IsString()
  number: string;

  @ApiProperty({ example: 'clxxx123' })
  @IsString()
  roomTypeId: string;

  @ApiProperty({ example: 2 })
  @IsNumber() @IsPositive()
  floor: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  isConnecting?: boolean;
}

export class UpdateRoomDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  number?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  roomTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @IsPositive()
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isConnecting?: boolean;
}

export class UpdateRoomStatusDto {
  @ApiProperty({ enum: RoomStatusEnum })
  @IsEnum(RoomStatusEnum)
  status: RoomStatusEnum;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}

export class RoomFilterDto {
  @ApiPropertyOptional({ enum: RoomStatusEnum })
  @IsOptional() @IsEnum(RoomStatusEnum)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  roomTypeId?: string;
}
