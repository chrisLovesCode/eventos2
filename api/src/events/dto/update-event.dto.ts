import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    description:
      'ID of the user to assign this event to (only admins/moderators)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Category ID to assign this event to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
