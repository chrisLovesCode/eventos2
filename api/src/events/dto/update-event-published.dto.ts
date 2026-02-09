import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateEventPublishedDto {
  @ApiProperty({ description: 'Publish state of the event', example: true })
  @IsBoolean()
  published: boolean;
}
