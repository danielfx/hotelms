import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() scopes?: string[];
}

export class CreateWebhookDto {
  @ApiProperty() @IsString() url: string;
  @ApiProperty() @IsArray() events: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() secret?: string;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() events?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
