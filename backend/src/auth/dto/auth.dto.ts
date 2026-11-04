import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsUUID,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}

export class RegisterDto extends LoginDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @MinLength(8)
  @MaxLength(72)
  declare password: string;
}

export class RefreshTokenDto {
  @IsUUID()
  userId: string;

  @IsString()
  @MinLength(1)
  refreshToken: string;
}
