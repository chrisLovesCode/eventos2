import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { UserBasicDto } from '../../common/dto/user-basic.dto';

export class LoginDto {
  @ApiProperty({
    example: 'admin@example.dev',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'changeMe',
    minLength: AUTH_CONSTANTS.MIN_PASSWORD_LENGTH,
    description: 'User password',
  })
  @IsString()
  @MinLength(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH)
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
    required: false,
  })
  refresh_token?: string;

  @ApiProperty({
    type: UserBasicDto,
    description: 'Authenticated user information',
  })
  user: UserBasicDto;
}
