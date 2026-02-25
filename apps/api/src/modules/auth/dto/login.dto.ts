import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'manager@grandplaza.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Manager123!' })
  @IsString()
  @MinLength(6)
  password: string;
}
