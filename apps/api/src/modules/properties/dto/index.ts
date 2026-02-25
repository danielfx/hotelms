import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePropertyDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() checkInTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() checkOutTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() taxRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() cityTaxRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() resortFee?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() amenities?: string[];
}

export class UpdatePropertySettingsDto {
  @ApiPropertyOptional() @IsOptional() policies?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsString() checkInTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() checkOutTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() taxRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() cityTaxRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() resortFee?: number;
}
