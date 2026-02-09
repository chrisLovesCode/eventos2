import { ApiProperty } from '@nestjs/swagger';
import { UserBasicDto } from '../../common/dto/user-basic.dto';

export class UserResponseDto extends UserBasicDto {
  @ApiProperty({ example: '2026-01-27T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-27T10:00:00.000Z' })
  updatedAt: Date;
}
