import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
} from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const existingByName = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `Kategorie mit Name '${createCategoryDto.name}' existiert bereits`,
      );
    }

    const existingBySlug = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existingBySlug) {
      throw new ConflictException(
        `Kategorie mit Slug '${createCategoryDto.slug}' existiert bereits`,
      );
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    return {
      ...category,
      eventCount: category._count.events,
    };
  }

  async findAll(includeEventCount = true): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    return categories.map((category) => ({
      ...category,
      eventCount: includeEventCount ? category._count?.events : undefined,
    }));
  }

  async findOne(
    id: string,
    includeEventCount = true,
  ): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Kategorie mit ID ${id} nicht gefunden`);
    }

    return {
      ...category,
      eventCount: includeEventCount ? category._count?.events : undefined,
    };
  }

  async findBySlug(
    slug: string,
    includeEventCount = true,
  ): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(
        `Kategorie mit Slug '${slug}' nicht gefunden`,
      );
    }

    return {
      ...category,
      eventCount: includeEventCount ? category._count?.events : undefined,
    };
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    await this.findOne(id, false); // Check if exists

    if (updateCategoryDto.name) {
      const existingByName = await this.prisma.category.findFirst({
        where: {
          name: updateCategoryDto.name,
          id: { not: id },
        },
      });

      if (existingByName) {
        throw new ConflictException(
          `Kategorie mit Name '${updateCategoryDto.name}' existiert bereits`,
        );
      }
    }

    if (updateCategoryDto.slug) {
      const existingBySlug = await this.prisma.category.findFirst({
        where: {
          slug: updateCategoryDto.slug,
          id: { not: id },
        },
      });

      if (existingBySlug) {
        throw new ConflictException(
          `Kategorie mit Slug '${updateCategoryDto.slug}' existiert bereits`,
        );
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    return {
      ...category,
      eventCount: category._count.events,
    };
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id, false); // Check if exists

    await this.prisma.category.delete({
      where: { id },
    });
  }
}
