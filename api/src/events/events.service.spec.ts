import { BadRequestException } from '@nestjs/common';
import { EventsService } from './events.service';

function makeService(overrides?: {
  prisma?: any;
  filesService?: any;
  geocodeService?: any;
  configService?: any;
}) {
  const prisma =
    overrides?.prisma ??
    ({
      event: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'evt_1',
          name: 'Test',
          slug: 'test',
          dateStart: new Date(),
          dateEnd: new Date(),
          description: 'desc',
          banner: null,
          userId: 'user_1',
          categoryId: null,
          published: false,
          isDeleted: false,
          deletedAt: null,
          orgaName: null,
          orgaWebsite: null,
          eventWebsite: null,
          eventAddress: null,
          latitude: null,
          longitude: null,
          registrationLink: null,
          isOnlineEvent: false,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user_1',
            email: 'u@example.com',
            nick: 'u',
            role: 'USER',
          },
          category: null,
        }),
      },
      $queryRawUnsafe: jest.fn(),
    }) as any;

  const filesService =
    overrides?.filesService ??
    ({
      deleteFile: jest.fn(),
    } as any);

  const geocodeService =
    overrides?.geocodeService ??
    ({
      geocodePostalCode: jest.fn().mockResolvedValue(null),
      geocodeAddress: jest.fn().mockResolvedValue(null),
    } as any);

  const configService =
    overrides?.configService ??
    ({
      get: jest.fn().mockReturnValue(undefined),
    } as any);

  const service = new EventsService(prisma, filesService, geocodeService, configService);
  return { service, prisma, filesService, geocodeService, configService };
}

describe('EventsService (unit)', () => {
  it('findAll: public (no user) only sees published events', async () => {
    const { service, prisma } = makeService();

    await service.findAll({ page: 1, limit: 10 } as any, false, false, undefined);

    expect(prisma.event.count).toHaveBeenCalledTimes(1);
    const where = prisma.event.count.mock.calls[0][0].where;
    expect(where).toMatchObject({ isDeleted: false, published: true });
  });

  it('findAll: owner can see own unpublished events without elevating includeUnpublished', async () => {
    const { service, prisma } = makeService();

    await service.findAll(
      { page: 1, limit: 10, search: 'foo' } as any,
      false,
      false,
      'user_1',
    );

    const where = prisma.event.count.mock.calls[0][0].where;
    expect(where.isDeleted).toBe(false);
    expect(where.OR).toEqual([{ published: true }, { userId: 'user_1' }]);
    expect(where.AND).toEqual(
      expect.arrayContaining([
        {
          OR: [
            { name: { contains: 'foo', mode: 'insensitive' } },
            { description: { contains: 'foo', mode: 'insensitive' } },
          ],
        },
      ]),
    );
  });

  it('findAll: includeUnpublished=true does not force published=true filter', async () => {
    const { service, prisma } = makeService();

    await service.findAll({ page: 1, limit: 10 } as any, false, true, undefined);

    const where = prisma.event.count.mock.calls[0][0].where;
    expect(where.isDeleted).toBe(false);
    expect(where.published).toBeUndefined();
    expect(where.OR).toBeUndefined();
  });

  it('create: allows same-day events (dateEnd == dateStart)', async () => {
    const { service, prisma } = makeService();

    const now = new Date('2026-02-09T12:00:00.000Z');
    await service.create(
      {
        name: 'Same day',
        slug: 'same-day',
        dateStart: now.toISOString(),
        dateEnd: now.toISOString(),
        description: '0123456789', // min length 10
      } as any,
      'user_1',
    );

    expect(prisma.event.findFirst).toHaveBeenCalled();
    expect(prisma.event.create).toHaveBeenCalled();
  });

  it('create: rejects when dateEnd is before dateStart', async () => {
    const { service } = makeService();

    const start = new Date('2026-02-10T12:00:00.000Z');
    const end = new Date('2026-02-09T12:00:00.000Z');

    await expect(
      service.create(
        {
          name: 'Invalid',
          slug: 'invalid',
          dateStart: start.toISOString(),
          dateEnd: end.toISOString(),
          description: '0123456789',
        } as any,
        'user_1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

