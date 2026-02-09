import { SetMetadata } from '@nestjs/common';

export const RESOURCE_OWNER_KEY = 'resourceOwner';

export interface ResourceOwnerOptions {
  userIdField?: string; // Name of field in resource (default: 'userId')
  paramName?: string; // Name des Route-Parameters (default: 'id')
  preventModeratorAccessToAdmin?: boolean; // Prevents moderator access to admin users (default: false)
  modelName?: string; // Prisma model name override (e.g., 'Event', 'User')
}

/**
 * Decorator to enable resource ownership check
 * @param options Configuration for the ownership check
 * @example @ResourceOwner() // Uses 'userId' by default
 * @example @ResourceOwner({ userIdField: 'createdBy' }) // Custom field
 * @example @ResourceOwner({ preventModeratorAccessToAdmin: true }) // For User resources
 */
export const ResourceOwner = (options: ResourceOwnerOptions = {}) =>
  SetMetadata(RESOURCE_OWNER_KEY, { userIdField: 'userId', ...options });
