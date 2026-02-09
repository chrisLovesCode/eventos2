import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ResourceOwnerGuard } from './resource-owner.guard';
import { Role } from '@prisma/client';

function makeContext(request: any) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

describe('ResourceOwnerGuard (unit)', () => {
  it('allows request when no @ResourceOwner metadata is present', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as any;
    const prisma = {} as any;

    const guard = new ResourceOwnerGuard(reflector, prisma);
    const ok = await guard.canActivate(makeContext({}));
    expect(ok).toBe(true);
  });

  it('allows admins without checking ownership', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({ userIdField: 'userId' }),
    } as any;
    const prisma = {
      event: {
        findUnique: jest.fn(),
      },
    } as any;

    const guard = new ResourceOwnerGuard(reflector, prisma);
    const ok = await guard.canActivate(
      makeContext({
        user: { sub: 'admin_1', role: Role.ADMIN },
        params: { id: 'evt_1' },
        route: { path: '/events/:id' },
      }),
    );

    expect(ok).toBe(true);
    expect(prisma.event.findUnique).not.toHaveBeenCalled();
  });

  it('allows owner access for user when resource userId matches token sub', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({ userIdField: 'userId' }),
    } as any;
    const prisma = {
      event: {
        findUnique: jest.fn().mockResolvedValue({ id: 'evt_1', userId: 'user_1' }),
      },
    } as any;

    const guard = new ResourceOwnerGuard(reflector, prisma);
    const ok = await guard.canActivate(
      makeContext({
        user: { sub: 'user_1', role: Role.USER },
        params: { id: 'evt_1' },
        route: { path: '/events/:id' },
      }),
    );

    expect(ok).toBe(true);
  });

  it('rejects when resource is owned by someone else', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({ userIdField: 'userId' }),
    } as any;
    const prisma = {
      event: {
        findUnique: jest.fn().mockResolvedValue({ id: 'evt_1', userId: 'user_2' }),
      },
    } as any;

    const guard = new ResourceOwnerGuard(reflector, prisma);
    await expect(
      guard.canActivate(
        makeContext({
          user: { sub: 'user_1', role: Role.USER },
          params: { id: 'evt_1' },
          route: { path: '/events/:id' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException when resource is missing', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({ userIdField: 'userId' }),
    } as any;
    const prisma = {
      event: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const guard = new ResourceOwnerGuard(reflector, prisma);
    await expect(
      guard.canActivate(
        makeContext({
          user: { sub: 'user_1', role: Role.USER },
          params: { id: 'evt_1' },
          route: { path: '/events/:id' },
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

