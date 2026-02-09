import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID', example: 'uuid-here' })
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Conference' })
  name: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'conference' })
  slug: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-27T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-27T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Number of events in this category',
    example: 5,
    required: false,
  })
  eventCount?: number;
}
