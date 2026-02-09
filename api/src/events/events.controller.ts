import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
  UpdateEventPublishedDto,
} from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ResourceOwnerGuard } from '../auth/guards/resource-owner.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ResourceOwner } from '../auth/decorators/resource-owner.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import {
  EventFilterDto,
  PaginatedResponseDto,
} from '../common/dto/pagination.dto';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnerGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 events per minute
  @Roles(Role.ADMIN, Role.MODERATOR, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event successfully created',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 409, description: 'Conflict - Slug already exists' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: { userId: string; role: Role; sub: string },
  ): Promise<EventResponseDto> {
    return this.eventsService.create(createEventDto, user.userId);
  }

  @Get()
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  @ApiOperation({ summary: 'Get all events with pagination and filtering' })
  @ApiQuery({
    name: 'includeUser',
    required: false,
    type: Boolean,
    description: 'Include user information',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Filter events starting after this date',
  })
  @ApiQuery({
    name: 'dateOn',
    required: false,
    type: String,
    description: 'Filter events that include this date in their range',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Filter events ending before this date',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter events by category ID',
  })
  @ApiQuery({
    name: 'categoryIds',
    required: false,
    type: String,
    description: 'Filter events by category IDs (comma-separated)',
  })
  @ApiQuery({
    name: 'categorySlug',
    required: false,
    type: String,
    description: 'Filter events by category slug',
  })
  @ApiQuery({
    name: 'categorySlugs',
    required: false,
    type: String,
    description: 'Filter events by category slugs (comma-separated)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name and description',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['dateStart', 'dateEnd', 'createdAt', 'name'],
    description: 'Sort by field (default: dateStart)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: asc)',
  })
  @ApiQuery({
    name: 'includePublished',
    required: false,
    type: Boolean,
    description: 'Include unpublished events (admin/moderator only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of events',
  })
  async findAll(
    @Query('includeUser', new DefaultValuePipe(false), ParseBoolPipe)
    includeUser: boolean,
    @Query('includePublished', new DefaultValuePipe(true), ParseBoolPipe)
    includePublished: boolean,
    @Query() filterDto: EventFilterDto,
    @CurrentUser() user?: { userId: string; role: Role },
  ): Promise<PaginatedResponseDto<EventResponseDto>> {
    // Admin and Moderator always see all events (published and unpublished)
    const canIncludeUnpublished =
      !!user && (user.role === Role.ADMIN || user.role === Role.MODERATOR);
    const includeUnpublished = canIncludeUnpublished;

    return this.eventsService.findAll(
      filterDto,
      includeUser,
      includeUnpublished,
      user?.userId,
    );
  }

  @Get('slug/:slug')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute for event details
  @ApiOperation({ summary: 'Get event by slug' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiQuery({
    name: 'includeUser',
    required: false,
    type: Boolean,
    description: 'Include user information',
  })
  @ApiQuery({
    name: 'includePublished',
    required: false,
    type: Boolean,
    description: 'Include unpublished events (admin/moderator only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Event found',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findBySlug(
    @Param('slug') slug: string,
    @Query('includeUser', new DefaultValuePipe(false), ParseBoolPipe)
    includeUser: boolean,
    @Query('includePublished', new DefaultValuePipe(true), ParseBoolPipe)
    includePublished: boolean,
    @CurrentUser() user?: { userId: string; role: Role },
  ): Promise<EventResponseDto> {
    // Admin and Moderator always see all events (published and unpublished)
    const canIncludeUnpublished =
      !!user && (user.role === Role.ADMIN || user.role === Role.MODERATOR);
    const includeUnpublished = canIncludeUnpublished;

    return this.eventsService.findBySlug(
      slug,
      includeUser,
      includeUnpublished,
      user?.userId,
    );
  }

  @Get('user/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all events by user ID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of events created by the user',
    type: [EventResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<EventResponseDto[]> {
    return this.eventsService.findByUser(userId);
  }

  @Get(':id')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute for event details
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiQuery({
    name: 'includeUser',
    required: false,
    type: Boolean,
    description: 'Include user information',
  })
  @ApiQuery({
    name: 'includePublished',
    required: false,
    type: Boolean,
    description: 'Include unpublished events (admin/moderator only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Event found',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeUser', new DefaultValuePipe(false), ParseBoolPipe)
    includeUser: boolean,
    @Query('includePublished', new DefaultValuePipe(true), ParseBoolPipe)
    includePublished: boolean,
    @CurrentUser() user?: { userId: string; role: Role },
  ): Promise<EventResponseDto> {
    // Admin and Moderator always see all events (published and unpublished)
    const canIncludeUnpublished =
      !!user && (user.role === Role.ADMIN || user.role === Role.MODERATOR);
    const includeUnpublished = canIncludeUnpublished;

    return this.eventsService.findOne(
      id,
      includeUser,
      includeUnpublished,
      user?.userId,
    );
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MODERATOR, Role.USER)
  @ResourceOwner()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event successfully updated',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Slug already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user?: { userId: string; role: Role },
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, updateEventDto, user?.role);
  }

  @Patch(':id/publish')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish/unpublish an event (Admin/Moderator)' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event publish state updated',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updatePublished(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePublishedDto: UpdateEventPublishedDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.updatePublished(id, updatePublishedDto.published);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MODERATOR, Role.USER)
  @ResourceOwner()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 204, description: 'Event successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.eventsService.remove(id);
  }
}
