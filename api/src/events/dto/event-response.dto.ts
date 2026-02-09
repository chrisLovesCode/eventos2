import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserBasicDto } from '../../common/dto/user-basic.dto';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class EventResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Tech Conference 2026' })
  name: string;

  @ApiProperty({ example: 'tech-conference-2026' })
  slug: string;

  @ApiProperty({ example: '2026-06-15T09:00:00Z' })
  dateStart: Date;

  @ApiProperty({ example: '2026-06-15T18:00:00Z' })
  dateEnd: Date;

  @ApiProperty({
    example: 'An exciting technology conference featuring industry leaders.',
  })
  description: string;

  @ApiPropertyOptional({ example: '/uploads/event-banner-uuid.webp' })
  banner: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string | null;

  @ApiPropertyOptional({ type: UserBasicDto })
  user?: UserBasicDto;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  categoryId: string | null;

  @ApiPropertyOptional({ type: CategoryResponseDto })
  category?: CategoryResponseDto;

  @ApiProperty({ example: true })
  published: boolean;

  @ApiPropertyOptional({ example: 'Tech Events GmbH' })
  orgaName: string | null;

  @ApiPropertyOptional({ example: 'https://techevents.com' })
  orgaWebsite: string | null;

  @ApiPropertyOptional({ example: 'https://conference2026.com' })
  eventWebsite: string | null;

  @ApiPropertyOptional({
    example: 'Convention Center, Hauptstraße 1, 10115 Berlin',
  })
  eventAddress: string | null;

  @ApiPropertyOptional({ example: 'https://conference2026.com/register' })
  registrationLink: string | null;

  @ApiProperty({ example: false })
  isOnlineEvent: boolean;

  @ApiProperty({ example: ['tech', 'ai', 'networking'], type: [String] })
  tags: string[];

  @ApiPropertyOptional({
    example: 52.520008,
    description: 'Event location latitude coordinate',
  })
  latitude: number | null;

  @ApiPropertyOptional({
    example: 13.404954,
    description: 'Event location longitude coordinate',
  })
  longitude: number | null;

  @ApiPropertyOptional({
    example: 5.2,
    description:
      'Distance in kilometers (only present in location-based searches)',
  })
  distance?: number;

  @ApiProperty({ example: '2026-01-27T07:29:04Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-27T07:29:04Z' })
  updatedAt: Date;
}
