import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserBasicDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'JohnDoe' })
  nick: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;
}
