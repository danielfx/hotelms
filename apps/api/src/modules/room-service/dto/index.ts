import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMenuItemDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsEnum(['BREAKFAST', 'APPETIZER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE', 'SNACK', 'COMBO']) category: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() prepTime?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() image?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) allergens?: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() sortOrder?: number;
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(['BREAKFAST', 'APPETIZER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE', 'SNACK', 'COMBO']) category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsNumber() prepTime?: number;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) allergens?: string[];
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class OrderItemDto {
  @ApiProperty() @IsString() menuItemId: string;
  @ApiProperty() @IsNumber() @Min(1) quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateOrderDto {
  @ApiProperty() @IsString() reservationId: string;
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() specialInstructions?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty() @IsEnum(['CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED']) status: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cancelReason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preparedBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() deliveredBy?: string;
}
