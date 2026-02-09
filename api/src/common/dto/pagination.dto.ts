import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsDateString,
  IsUUID,
  IsString,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum EventSortBy {
  DATE_START = 'dateStart',
  DATE_END = 'dateEnd',
  CREATED_AT = 'createdAt',
  NAME = 'name',
  DISTANCE = 'distance',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class EventFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter events that include this date in their range',
    example: '2026-01-28',
  })
  @IsOptional()
  @IsString()
  dateOn?: string;

  @ApiPropertyOptional({
    description: 'Filter events starting after this date',
    example: '2026-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter events ending before this date',
    example: '2026-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by category IDs (comma-separated)',
    example:
      '550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440111',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value.split(',').filter(Boolean);
    }
    return [];
  })
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by category slug',
    example: 'conference',
  })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({
    description: 'Filter by category slugs (comma-separated)',
    example: 'conference,meetup',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((slug) => slug.trim())
        .filter(Boolean);
    }
    return [];
  })
  @IsString({ each: true })
  categorySlugs?: string[];

  @ApiPropertyOptional({
    description: 'Search in event name and description',
    example: 'conference',
  })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: EventSortBy,
    default: EventSortBy.DATE_START,
  })
  @IsOptional()
  @IsEnum(EventSortBy)
  sortBy?: EventSortBy = EventSortBy.DATE_START;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  // Location-based search
  @ApiPropertyOptional({
    description: 'Latitude for location-based search',
    example: 50.9375,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude for location-based search',
    example: 6.9603,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Radius in kilometers for location-based search',
    example: 50,
    minimum: 1,
    maximum: 500,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(500)
  radius?: number = 50;

  @ApiPropertyOptional({
    description: 'Postal code for location-based search (German postal codes)',
    example: '50667',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({
    description: 'Array of items',
  })
  data: T[];

  @ApiPropertyOptional({
    description: 'Pagination metadata',
    example: {
      total: 50,
      page: 1,
      limit: 10,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
