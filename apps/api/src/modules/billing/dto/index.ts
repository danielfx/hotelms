import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty() @IsString() planId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethodId?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() planId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
