import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  IsBoolean,
  IsArray,
  IsUrl,
  IsNumber,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsSlug } from '../../common/validators/slug.validator';

export class CreateEventDto {
  @ApiProperty({
    description: 'Event name',
    example: 'Tech Conference 2026',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the event',
    example: 'tech-conference-2026',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @IsNotEmpty()
  @IsSlug()
  slug: string;

  @ApiProperty({
    description: 'Event start date and time',
    example: '2026-06-15T09:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dateStart: string;

  @ApiProperty({
    description: 'Event end date and time',
    example: '2026-06-15T18:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dateEnd: string;

  @ApiProperty({
    description: 'Detailed description of the event',
    example:
      'An exciting technology conference featuring industry leaders and cutting-edge innovations.',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    description: 'URL path to event banner image',
    example: '/uploads/event-banner-uuid.webp',
  })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({
    description: 'Category ID to assign this event to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Organization name',
    example: 'Tech Events GmbH',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  orgaName?: string;

  @ApiPropertyOptional({
    description: 'Organization website URL',
    example: 'https://techevents.com',
  })
  @IsOptional()
  @IsUrl()
  orgaWebsite?: string;

  @ApiPropertyOptional({
    description: 'Event website URL',
    example: 'https://conference2026.com',
  })
  @IsOptional()
  @IsUrl()
  eventWebsite?: string;

  @ApiPropertyOptional({
    description: 'Physical event address',
    example: 'Convention Center, Hauptstraße 1, 10115 Berlin',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  eventAddress?: string;

  @ApiPropertyOptional({
    description: 'Registration link URL',
    example: 'https://conference2026.com/register',
  })
  @IsOptional()
  @IsUrl()
  registrationLink?: string;

  @ApiPropertyOptional({
    description: 'Whether this is an online event',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOnlineEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Event tags for categorization',
    example: ['tech', 'ai', 'networking'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Event location latitude coordinate',
    example: 52.520008,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Event location longitude coordinate',
    example: 13.404954,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;
}
