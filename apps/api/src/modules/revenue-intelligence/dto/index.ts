import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePricingRuleDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() conditions: Record<string, any>;
  @ApiProperty() @IsString() adjustmentType: string;
  @ApiProperty() @IsNumber() adjustmentValue: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() priority?: number;
}

export class UpdatePricingRuleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() conditions?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsString() adjustmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() adjustmentValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() priority?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
