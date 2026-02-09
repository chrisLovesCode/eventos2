import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { GeocodeService } from '../geocode/geocode.service';
import { haversineDistanceSQL } from '../geocode/utils/geo.utils';
import { Event, User, Prisma, Role } from '@prisma/client';
import { CreateEventDto, UpdateEventDto, EventResponseDto } from './dto';
import {
  EventFilterDto,
  PaginatedResponseDto,
} from '../common/dto/pagination.dto';

/**
 * Service handling event operations
 * Manages CRUD operations for events with business logic and validations
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private geocodeService: GeocodeService,
    private configService: ConfigService,
  ) {}

  /**
   * Creates a new event
   * @param createEventDto Event data
   * @param authenticatedUserId ID of the authenticated user creating the event
   * @returns Created event with user information
   * @throws BadRequestException if dateEnd is not after dateStart
   * @throws ConflictException if slug already exists
   */
  async create(
    createEventDto: CreateEventDto,
    authenticatedUserId: string,
  ): Promise<EventResponseDto> {
    const {
      dateStart,
      dateEnd,
      slug,
      eventAddress,
      latitude,
      longitude,
      ...rest
    } = createEventDto;

    // Validate dates
    const start = new Date(dateStart);
    const end = new Date(dateEnd);

    // Allow same-day events (equal timestamps); only forbid end before start.
    if (end < start) {
      throw new BadRequestException('Enddatum muss nach dem Startdatum liegen');
    }

    // Check if slug already exists (only among non-deleted events)
    const existingEvent = await this.prisma.event.findFirst({
      where: {
        slug,
        isDeleted: false,
      },
    });

    if (existingEvent) {
      throw new ConflictException(`Event mit Slug '${slug}' existiert bereits`);
    }

    // Auto-geocode if address provided but no coordinates
    let finalLatitude = latitude;
    let finalLongitude = longitude;

    if (eventAddress && !latitude && !longitude) {
      this.logger.log(`Auto-geocoding address: ${eventAddress}`);
      try {
        const geocodeResult =
          await this.geocodeService.geocodeAddress(eventAddress);
        if (geocodeResult) {
          finalLatitude = geocodeResult.latitude;
          finalLongitude = geocodeResult.longitude;
          this.logger.log(`Geocoded to: ${finalLatitude}, ${finalLongitude}`);
        }
      } catch (error) {
        this.logger.warn(
          `Geocoding failed for address: ${eventAddress}`,
          error.message,
        );
      }
    }

    const event = await this.prisma.event.create({
      data: {
        ...rest,
        slug,
        dateStart: start,
        dateEnd: end,
        eventAddress,
        latitude: finalLatitude,
        longitude: finalLongitude,
        userId: authenticatedUserId,
        ...(createEventDto.categoryId && {
          categoryId: createEventDto.categoryId,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nick: true,
            role: true,
          },
        },
        category: true,
      },
    });

    return this.mapToResponseDto(event);
  }

  /**
   * Retrieves all events with pagination and filtering
   * @param filterDto Filter and pagination options
   * @param includeUser Whether to include user information in response
   * @returns Paginated list of events with metadata
   */
  async findAll(
    filterDto: EventFilterDto,
    includeUser: boolean = false,
    includeUnpublished: boolean = false,
    requestingUserId?: string,
  ): Promise<PaginatedResponseDto<EventResponseDto>> {
    const {
      page = 1,
      limit = 10,
      dateOn,
      dateFrom,
      dateTo,
      userId,
      categoryId,
      categoryIds,
      categorySlug,
      categorySlugs,
      search,
      sortBy,
      sortOrder,
      latitude,
      longitude,
      radius = 50,
      postalCode,
    } = filterDto;

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    const where: Prisma.EventWhereInput = {
      isDeleted: false,
      // Show published events OR (unpublished events if includeUnpublished OR owned by requesting user)
      ...(!includeUnpublished && !requestingUserId
        ? { published: true }
        : includeUnpublished
          ? {}
          : {
              OR: [{ published: true }, { userId: requestingUserId }],
            }),
    };

    if (dateOn) {
      const onDate = new Date(dateOn);
      if (!isNaN(onDate.getTime())) {
        const andConditions = Array.isArray(where.AND) ? where.AND : [];
        where.AND = [
          ...andConditions,
          { dateStart: { lte: onDate } },
          { dateEnd: { gte: onDate } },
        ];
      }
    }

    if (dateFrom) {
      where.dateStart = { gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.dateEnd = { lte: new Date(dateTo) };
    }

    if (userId) {
      where.userId = userId;
    }

    const resolvedCategoryIds =
      categoryIds && categoryIds.length > 0
        ? categoryIds
        : categoryId
          ? [categoryId]
          : undefined;

    if (resolvedCategoryIds) {
      where.categoryId = { in: resolvedCategoryIds };
    }

    const resolvedCategorySlugs =
      categorySlugs && categorySlugs.length > 0
        ? categorySlugs
        : categorySlug
          ? [categorySlug]
          : undefined;

    if (resolvedCategorySlugs) {
      where.category = {
        slug: { in: resolvedCategorySlugs },
      };
    }

    if (search) {
      const andConditions = Array.isArray(where.AND) ? where.AND : [];
      where.AND = [
        ...andConditions,
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Location-based search
    let userLat = latitude;
    let userLon = longitude;

    // If postal code is provided, geocode it first
    if (postalCode && !userLat && !userLon) {
      this.logger.log(`Geocoding postal code: ${postalCode}`);
      const geocodeResult =
        await this.geocodeService.geocodePostalCode(postalCode);
      if (geocodeResult) {
        userLat = geocodeResult.latitude;
        userLon = geocodeResult.longitude;
        this.logger.log(`Geocoded ${postalCode} to (${userLat}, ${userLon})`);
      } else {
        this.logger.warn(`Failed to geocode postal code: ${postalCode}`);
      }
    }

    // If we have coordinates, filter by radius using parameterized SQL
    let eventsWithDistance: Array<Event & { distance?: number }> = [];
    let total = 0;

    if (userLat && userLon) {
      // Build WHERE conditions with parameters to prevent SQL injection
      const whereConditions: string[] = ['e."isDeleted" = false'];
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (!includeUnpublished && !requestingUserId) {
        whereConditions.push('e.published = true');
      } else if (!includeUnpublished && requestingUserId) {
        whereConditions.push(
          `(e.published = true OR e."userId" = $${paramIndex})`,
        );
        queryParams.push(requestingUserId);
        paramIndex++;
      }

      if (dateOn) {
        const onDate = new Date(dateOn);
        if (!isNaN(onDate.getTime())) {
          const dateStr = onDate.toISOString().split('T')[0];
          whereConditions.push(`e."dateStart"::date <= $${paramIndex}`);
          queryParams.push(dateStr);
          paramIndex++;
          whereConditions.push(`e."dateEnd"::date >= $${paramIndex}`);
          queryParams.push(dateStr);
          paramIndex++;
        }
      }

      if (dateFrom) {
        whereConditions.push(`e."dateStart" >= $${paramIndex}`);
        queryParams.push(new Date(dateFrom).toISOString());
        paramIndex++;
      }

      if (dateTo) {
        whereConditions.push(`e."dateEnd" <= $${paramIndex}`);
        queryParams.push(new Date(dateTo).toISOString());
        paramIndex++;
      }

      if (userId) {
        whereConditions.push(`e."userId" = $${paramIndex}`);
        queryParams.push(userId);
        paramIndex++;
      }

      if (categoryId) {
        whereConditions.push(`e."categoryId" = $${paramIndex}`);
        queryParams.push(categoryId);
        paramIndex++;
      }

      if (categoryIds && categoryIds.length > 0) {
        const placeholders = categoryIds
          .map(() => {
            const placeholder = `$${paramIndex}`;
            paramIndex++;
            return placeholder;
          })
          .join(',');
        whereConditions.push(`e."categoryId" IN (${placeholders})`);
        queryParams.push(...categoryIds);
      }

      if (categorySlug || (categorySlugs && categorySlugs.length > 0)) {
        const slugs = categorySlug ? [categorySlug] : categorySlugs || [];
        if (slugs.length > 0) {
          const placeholders = slugs
            .map(() => {
              const placeholder = `$${paramIndex}`;
              paramIndex++;
              return placeholder;
            })
            .join(',');
          whereConditions.push(`c.slug IN (${placeholders})`);
          queryParams.push(...slugs);
        }
      }

      if (search) {
        whereConditions.push(
          `(e.name ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`,
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Only include events with coordinates
      whereConditions.push('e.latitude IS NOT NULL');
      whereConditions.push('e.longitude IS NOT NULL');

      const whereClause = whereConditions.join(' AND ');
      const distanceFormula = haversineDistanceSQL(
        userLat,
        userLon,
        'e.latitude',
        'e.longitude',
      );

      // Add radius parameter
      whereConditions.push(`${distanceFormula} <= $${paramIndex}`);
      queryParams.push(radius);
      paramIndex++;

      const finalWhereClause = whereConditions.join(' AND ');

      // Count total matching events within radius
      const countQuery = `
        SELECT COUNT(*) as total
        FROM events e
        LEFT JOIN categories c ON e."categoryId" = c.id
        WHERE ${finalWhereClause}
      `;

      const countResult = await this.prisma.$queryRawUnsafe<
        Array<{ total: bigint }>
      >(countQuery, ...queryParams);
      total = Number(countResult[0]?.total || 0);

      // Fetch events within radius with distance
      const orderByColumn =
        sortBy === 'distance' ? 'distance' : sortBy || 'dateStart';
      const orderDirection =
        sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      const orderByClause =
        sortBy === 'distance'
          ? `distance ${orderDirection}`
          : `e."${orderByColumn}" ${orderDirection}`;

      // Add limit and offset as final parameters
      const limitParamIndex = paramIndex;
      const offsetParamIndex = paramIndex + 1;

      const eventsQuery = `
        SELECT 
          e.*,
          ${distanceFormula} as distance
        FROM events e
        LEFT JOIN categories c ON e."categoryId" = c.id
        WHERE ${finalWhereClause}
        ORDER BY ${orderByClause}
        LIMIT $${limitParamIndex}
        OFFSET $${offsetParamIndex}
      `;

      queryParams.push(limit, skip);

      eventsWithDistance = await this.prisma.$queryRawUnsafe<
        Array<Event & { distance: number }>
      >(eventsQuery, ...queryParams);

      this.logger.log(
        `Location search: Found ${total} events within ${radius}km of (${userLat}, ${userLon})`,
      );
    } else {
      // Standard search without location
      total = await this.prisma.event.count({ where });

      eventsWithDistance = await this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy || 'dateStart']: sortOrder || 'asc',
        } as Prisma.EventOrderByWithRelationInput,
      });
    }

    // Fetch related data for events
    const eventIds = eventsWithDistance.map((e) => e.id);
    const eventsWithRelations = await this.prisma.event.findMany({
      where: { id: { in: eventIds } },
      include: {
        user: includeUser
          ? {
              select: {
                id: true,
                email: true,
                nick: true,
                role: true,
              },
            }
          : false,
        category: true,
      },
    });

    // Map events maintaining order and add distance
    const orderedEvents = eventIds
      .map((id) => {
        const event = eventsWithRelations.find((e) => e.id === id);
        const eventWithDist = eventsWithDistance.find((e) => e.id === id);
        return event ? { ...event, distance: eventWithDist?.distance } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    const totalPages = Math.ceil(total / limit);

    return {
      data: orderedEvents.map((event) => this.mapToResponseDto(event)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Retrieves a single event by ID
   * @param id Event UUID
   * @param includeUser Whether to include user information in response
   * @returns Event details
   * @throws NotFoundException if event not found
   */
  async findOne(
    id: string,
    includeUser: boolean = false,
    includeUnpublished: boolean = false,
    requestingUserId?: string,
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        isDeleted: false,
        ...(!includeUnpublished && !requestingUserId
          ? { published: true }
          : includeUnpublished
            ? {}
            : {
                OR: [{ published: true }, { userId: requestingUserId }],
              }),
      },
      include: {
        user: includeUser
          ? {
              select: {
                id: true,
                email: true,
                nick: true,
                role: true,
              },
            }
          : false,
        category: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event mit ID ${id} nicht gefunden`);
    }

    return this.mapToResponseDto(event);
  }

  /**
   * Retrieves a single event by slug
   * @param slug Event slug (URL-friendly identifier)
   * @param includeUser Whether to include user information in response
   * @returns Event details
   * @throws NotFoundException if event not found
   */
  async findBySlug(
    slug: string,
    includeUser: boolean = false,
    includeUnpublished: boolean = false,
    requestingUserId?: string,
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findFirst({
      where: {
        slug,
        isDeleted: false,
        ...(!includeUnpublished && !requestingUserId
          ? { published: true }
          : includeUnpublished
            ? {}
            : {
                OR: [{ published: true }, { userId: requestingUserId }],
              }),
      },
      include: {
        user: includeUser
          ? {
              select: {
                id: true,
                email: true,
                nick: true,
                role: true,
              },
            }
          : false,
        category: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event mit Slug '${slug}' nicht gefunden`);
    }

    return this.mapToResponseDto(event);
  }

  /**
   * Retrieves all events created by a specific user
   * @param userId User UUID
   * @returns List of user's events ordered by start date
   * @throws NotFoundException if user not found
   */
  async findByUser(userId: string): Promise<EventResponseDto[]> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Benutzer mit ID ${userId} nicht gefunden`);
    }

    const events = await this.prisma.event.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nick: true,
            role: true,
          },
        },
        category: true,
      },
      orderBy: {
        dateStart: 'asc',
      },
    });

    return events.map((event) => this.mapToResponseDto(event));
  }

  /**
   * Updates an existing event
   * @param id Event UUID
   * @param updateEventDto Updated event data (partial)
   * @returns Updated event details
   * @throws NotFoundException if event or user (when reassigning) not found
   * @throws BadRequestException if dateEnd is not after dateStart
   * @throws ConflictException if new slug already exists
   */
  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    requestingUserRole?: Role,
  ): Promise<EventResponseDto> {
    const existingEvent = await this.prisma.event.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingEvent) {
      throw new NotFoundException(`Event mit ID ${id} nicht gefunden`);
    }

    const {
      dateStart,
      dateEnd,
      slug,
      userId,
      eventAddress,
      latitude,
      longitude,
      ...rest
    } = updateEventDto;

    // Prepare date objects
    const newStartDate = dateStart
      ? new Date(dateStart)
      : existingEvent.dateStart;
    const newEndDate = dateEnd ? new Date(dateEnd) : existingEvent.dateEnd;

    // Validate dates (always, using either new or existing dates)
    // Allow same-day events (equal timestamps); only forbid end before start.
    if (newEndDate < newStartDate) {
      throw new BadRequestException('Enddatum muss nach dem Startdatum liegen');
    }

    // Only admins/moderators can change slug
    if (
      slug &&
      requestingUserRole !== Role.ADMIN &&
      requestingUserRole !== Role.MODERATOR
    ) {
      throw new ForbiddenException(
        'Slug kann nur von Admins oder Moderatoren geändert werden',
      );
    }

    // Check slug uniqueness if slug is being updated
    if (slug && slug !== existingEvent.slug) {
      const eventWithSlug = await this.prisma.event.findUnique({
        where: { slug },
      });

      if (eventWithSlug) {
        throw new ConflictException(
          `Event mit Slug '${slug}' existiert bereits`,
        );
      }
    }

    // Validate userId if provided (admins/moderators can reassign events)
    if (userId) {
      if (
        requestingUserRole !== Role.ADMIN &&
        requestingUserRole !== Role.MODERATOR
      ) {
        throw new ForbiddenException(
          'Nur Admins oder Moderatoren können Events neu zuweisen',
        );
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Benutzer nicht gefunden');
      }
    }

    // Validate categoryId if provided
    if (updateEventDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateEventDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Kategorie nicht gefunden');
      }
    }

    // Auto-geocode if address changed but no new coordinates provided
    let finalLatitude =
      latitude !== undefined ? latitude : existingEvent.latitude;
    let finalLongitude =
      longitude !== undefined ? longitude : existingEvent.longitude;

    const addressChanged =
      eventAddress && eventAddress !== existingEvent.eventAddress;
    const coordinatesNotProvided =
      latitude === undefined && longitude === undefined;

    if (addressChanged && coordinatesNotProvided) {
      this.logger.log(`Auto-geocoding updated address: ${eventAddress}`);
      try {
        const geocodeResult =
          await this.geocodeService.geocodeAddress(eventAddress);
        if (geocodeResult) {
          finalLatitude = geocodeResult.latitude;
          finalLongitude = geocodeResult.longitude;
          this.logger.log(`Geocoded to: ${finalLatitude}, ${finalLongitude}`);
        }
      } catch (error) {
        this.logger.warn(
          `Geocoding failed for address: ${eventAddress}`,
          error.message,
        );
      }
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...rest,
        ...(slug && { slug }),
        ...(dateStart && { dateStart: newStartDate }),
        ...(dateEnd && { dateEnd: newEndDate }),
        ...(eventAddress !== undefined && { eventAddress }),
        ...(finalLatitude !== undefined && { latitude: finalLatitude }),
        ...(finalLongitude !== undefined && { longitude: finalLongitude }),
        ...(userId !== undefined && { userId: userId || null }),
        ...(updateEventDto.categoryId !== undefined && {
          categoryId: updateEventDto.categoryId || null,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nick: true,
            role: true,
          },
        },
        category: true,
      },
    });

    return this.mapToResponseDto(event);
  }

  async updatePublished(
    id: string,
    published: boolean,
  ): Promise<EventResponseDto> {
    await this.findOne(id, false, true);

    const event = await this.prisma.event.update({
      where: { id },
      data: { published },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nick: true,
            role: true,
          },
        },
        category: true,
      },
    });

    return this.mapToResponseDto(event);
  }

  /**
   * Soft-deletes an event (marks as deleted instead of removing from database)
   * Frees up the slug by appending deletion timestamp
   * Also deletes associated banner file if present
   * @param id Event UUID
   * @throws NotFoundException if event not found or already deleted
   */
  async remove(id: string): Promise<void> {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event mit ID ${id} nicht gefunden`);
    }

    // Delete banner file if exists
    if (event.banner) {
      await this.filesService.deleteFile(event.banner);
    }

    // Rename slug to free it up for new events: slug-deleted-timestamp
    const deletedSlug = `${event.slug}-deleted-${Date.now()}`;

    await this.prisma.event.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        slug: deletedSlug,
        banner: null,
      },
    });
  }

  /**
   * Transforms banner URL to use the correct public domain
   * @param banner Banner URL from database
   * @returns Transformed banner URL with public domain
   * @private
   */
  private transformBannerUrl(banner: string | null): string | null {
    if (!banner) return null;

    const apiPublicUrl =
      this.configService.get<string>('API_PUBLIC_URL') ||
      this.configService.get<string>('API_URL_HOST') ||
      'http://localhost:3000';

    // If banner is a relative path, convert to absolute URL
    if (banner.startsWith('/uploads/')) {
      return `${apiPublicUrl}${banner}`;
    }

    // If banner contains old IP address, replace with domain
    if (banner.includes('://46.225.64.60/')) {
      return banner.replace(/https?:\/\/46\.225\.64\.60\//, `${apiPublicUrl}/`);
    }

    return banner;
  }

  /**
   * Maps Prisma event entity to EventResponseDto
   * @param event Prisma event entity (may include user relation)
   * @returns EventResponseDto with optional user information
   * @private
   */
  private mapToResponseDto(
    event: Event & {
      user?: Pick<User, 'id' | 'email' | 'nick' | 'role'> | null;
      category?: any;
      distance?: number;
    },
  ): EventResponseDto {
    return {
      id: event.id,
      name: event.name,
      slug: event.slug,
      dateStart: event.dateStart,
      dateEnd: event.dateEnd,
      description: event.description,
      banner: this.transformBannerUrl(event.banner),
      userId: event.userId,
      categoryId: event.categoryId,
      published: event.published,
      orgaName: event.orgaName,
      orgaWebsite: event.orgaWebsite,
      eventWebsite: event.eventWebsite,
      eventAddress: event.eventAddress,
      registrationLink: event.registrationLink,
      isOnlineEvent: event.isOnlineEvent,
      tags: event.tags,
      latitude: event.latitude,
      longitude: event.longitude,
      ...(event.distance !== undefined && { distance: event.distance }),
      user: event.user
        ? {
            id: event.user.id,
            email: event.user.email,
            nick: event.user.nick,
            role: event.user.role,
          }
        : undefined,
      category: event.category,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
