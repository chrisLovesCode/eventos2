import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AUTH_CONSTANTS } from '../../auth/constants/auth.constants';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'JohnDoe' })
  @IsOptional()
  @IsString()
  nick?: string;

  @ApiPropertyOptional({ example: 'newPassword123' })
  @IsOptional()
  @IsString()
  @MinLength(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten',
  })
  password?: string;

  @ApiPropertyOptional({
    enum: Role,
    example: Role.USER,
    description: 'Only Admins can change roles',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
