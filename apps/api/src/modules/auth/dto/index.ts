// ============================================================
// AUTH DTOs
// ============================================================
// dto/login.dto.ts
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

// dto/register.dto.ts
export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(8) password: string;
}

// dto/forgot-password.dto.ts
export class ForgotPasswordDto {
  @IsEmail() email: string;
}

// dto/reset-password.dto.ts
export class ResetPasswordDto {
  @IsString() token: string;
  @IsString() @MinLength(8) newPassword: string;
}

// dto/change-password.dto.ts
export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(8) newPassword: string;
}

// dto/switch-property.dto.ts
export class SwitchPropertyDto {
  @IsString() propertyId: string;
}
