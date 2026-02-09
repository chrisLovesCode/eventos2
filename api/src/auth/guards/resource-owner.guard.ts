import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RESOURCE_OWNER_KEY,
  ResourceOwnerOptions,
} from '../decorators/resource-owner.decorator';
import { Role } from '@prisma/client';

type RequestUser = {
  sub: string;
  userId?: string;
  role: Role;
};

type RequestWithUser = {
  user?: RequestUser;
  params: Record<string, string>;
  route?: { path?: string };
  url?: string;
};

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<ResourceOwnerOptions>(
      RESOURCE_OWNER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      // No @ResourceOwner decorator, skip check
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins can access everything
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Get resource ID from route parameters
    const paramName = options.paramName || 'id';
    const resourceId = request.params[paramName];

    if (!resourceId) {
      throw new ForbiddenException('Resource ID not found in request');
    }

    // Determine the model name from the route
    const modelName =
      options.modelName || this.getModelNameFromRequest(request);

    if (!modelName) {
      throw new ForbiddenException('Could not determine resource type');
    }

    // Fetch the resource from database
    const resource = await this.fetchResource(modelName, resourceId);

    if (!resource) {
      throw new NotFoundException(
        `${modelName} with ID ${resourceId} not found`,
      );
    }

    // For User model: userIdField is 'id', so resource ID === user ID
    const userIdField = options?.userIdField || 'userId';
    const isUserResource = userIdField === 'id';

    if (isUserResource) {
      // Special protection: Moderators cannot modify admin users
      if (
        options.preventModeratorAccessToAdmin &&
        user.role === Role.MODERATOR
      ) {
        if (this.getRole(resource) === Role.ADMIN) {
          throw new ForbiddenException('Moderators cannot modify admin users');
        }
        // Moderator can modify non-admin users
        return true;
      }

      // Regular users can only modify themselves
      if (user.role === Role.USER) {
        if (resourceId !== user.sub) {
          throw new ForbiddenException('You can only modify your own profile');
        }
      }

      return true;
    }

    // For non-User resources (Events, etc.): Check ownership via userId field
    const resourceUserId = this.getStringField(resource, userIdField);

    // If resource has no owner (null userId), only admins can modify
    if (resourceUserId === null) {
      throw new ForbiddenException(
        'This resource has no owner and can only be modified by admins',
      );
    }

    // Check if the current user owns the resource
    if (resourceUserId !== user.sub) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }

  private getModelNameFromRequest(request: RequestWithUser): string | null {
    const path = request.route?.path || request.url;

    if (!path) {
      return null;
    }

    // Extract model name from path (e.g., /events/:id -> event)
    const match = path.match(/\/([a-z]+)\//i);
    if (match && match[1]) {
      // Singular form for Prisma model
      const modelName = match[1].endsWith('s')
        ? match[1].slice(0, -1)
        : match[1];

      // Capitalize first letter for Prisma model name
      return modelName.charAt(0).toUpperCase() + modelName.slice(1);
    }

    return null;
  }

  private async fetchResource(
    modelName: string,
    resourceId: string,
  ): Promise<Record<string, unknown>> {
    const modelKey = modelName.toLowerCase();
    const prismaWithModels = this.prisma as unknown as Record<
      string,
      {
        findUnique: (args: { where: { id: string } }) => Promise<unknown>;
      }
    >;
    const model = prismaWithModels[modelKey];

    if (!model) {
      throw new ForbiddenException(`Model ${modelName} not found`);
    }

    try {
      const result = await model.findUnique({
        where: { id: resourceId },
      });
      return result as Record<string, unknown>;
    } catch {
      throw new ForbiddenException(`Error fetching ${modelName}`);
    }
  }

  private getStringField(
    resource: Record<string, unknown>,
    field: string,
  ): string | null {
    const value = resource[field];
    if (typeof value === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return null;
    }
    // Fallback: convert to string without using String() on object
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  private getRole(resource: Record<string, unknown>): Role | null {
    const value = resource['role'];
    if (
      value === Role.ADMIN ||
      value === Role.MODERATOR ||
      value === Role.USER
    ) {
      return value;
    }
    return null;
  }
}
