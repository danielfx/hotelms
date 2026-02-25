import { IsString, IsOptional, IsNumber, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyName?: string;
  @ApiProperty() @IsDateString() checkIn: string;
  @ApiProperty() @IsDateString() checkOut: string;
  @ApiProperty() @IsNumber() totalRooms: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() baseRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() cutoffDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateGroupDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalRooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() confirmedRooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateGroupBlockDto {
  @ApiProperty() @IsString() roomTypeCode: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty() @IsNumber() blocked: number;
  @ApiProperty() @IsNumber() rate: number;
}

export class CreateRoomingListEntryDto {
  @ApiProperty() @IsString() guestName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() guestEmail?: string;
  @ApiProperty() @IsString() roomTypeCode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() roomNumber?: string;
  @ApiProperty() @IsDateString() checkIn: string;
  @ApiProperty() @IsDateString() checkOut: string;
}

export class CreateEventSpaceDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsNumber() capacity: number;
  @ApiProperty() @IsNumber() hourlyRate: number;
  @ApiProperty() @IsNumber() halfDayRate: number;
  @ApiProperty() @IsNumber() fullDayRate: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() amenities?: string[];
}

export class CreateEventBookingDto {
  @ApiProperty() @IsString() eventSpaceId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() groupId?: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsDateString() eventDate: string;
  @ApiProperty() @IsString() startTime: string;
  @ApiProperty() @IsString() endTime: string;
  @ApiProperty() @IsNumber() attendees: number;
  @ApiProperty() @IsNumber() totalAmount: number;
}
