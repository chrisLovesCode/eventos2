import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { login } from './utils/auth';
import { EventResponse } from './types/test-types';

describe('EventsController (e2e) - Test User', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserToken: string;
  let testUserId: string;
  let createdEventId: string;
  let moderatorToken: string;
  let moderatorUserId: string;
  let visibilityEventId: string;
  let visibilityEventSlug: string;
  let visibilitySearchToken: string;

  const testUserEmail = 'testuser@example.dev';
  const testUserPassword = 'changeMe';
  const moderatorEmail = 'moderator.events@example.dev';
  const moderatorPassword = 'changeMe';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Global Validation Pipe wie in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Login as test user and get token
    const loginResponse = await login(app, testUserEmail, testUserPassword);

    testUserToken = loginResponse.token;
    testUserId = loginResponse.user.id;

    expect(testUserToken).toBeDefined();
    expect(loginResponse.user.role).toBe('USER');

    // Cleanup: Delete all test user events from previous test runs
    prisma = app.get(PrismaService);
    await prisma.event.deleteMany({
      where: { userId: testUserId },
    });

    const moderatorPasswordHash = await bcrypt.hash(moderatorPassword, 10);
    const existingModerator = await prisma.user.findUnique({
      where: { email: moderatorEmail },
    });

    if (existingModerator) {
      const updatedModerator = await prisma.user.update({
        where: { email: moderatorEmail },
        data: {
          nick: 'event_moderator',
          role: 'MODERATOR',
          isActive: true,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          password: moderatorPasswordHash,
          provider: 'LOCAL',
        },
      });
      moderatorUserId = updatedModerator.id;
    } else {
      const createdModerator = await prisma.user.create({
        data: {
          email: moderatorEmail,
          nick: 'event_moderator',
          password: moderatorPasswordHash,
          role: 'MODERATOR',
          isActive: true,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          provider: 'LOCAL',
        },
      });
      moderatorUserId = createdModerator.id;
    }

    const moderatorLoginResponse = await login(
      app,
      moderatorEmail,
      moderatorPassword,
    );
    moderatorToken = moderatorLoginResponse.token;
  });

  afterAll(async () => {
    // Cleanup: Delete test events
    await prisma.event.deleteMany({
      where: {
        slug: {
          in: ['test-conference-2026', 'test-conference-2026-updated'],
        },
      },
    });
    await prisma.event.deleteMany({
      where: { userId: moderatorUserId },
    });
    await prisma.user.deleteMany({
      where: { email: moderatorEmail },
    });
    await app.close();
  });

  describe('Event Lifecycle: Create, Update, Delete', () => {
    it('should create a new event as test user', async () => {
      // Cleanup any existing test events first
      await prisma.event.deleteMany({
        where: {
          slug: 'test-conference-2026',
        },
      });

      const eventData = {
        name: 'Test Conference 2026',
        slug: 'test-conference-2026',
        dateStart: '2026-12-01T09:00:00Z',
        dateEnd: '2026-12-01T18:00:00Z',
        description:
          'This is a test event created by the test user for e2e testing purposes.',
        // Note: Events are created as unpublished by default
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(eventData)
        .expect(201);

      const event = response.body as EventResponse;
      expect(event).toHaveProperty('id');
      expect(event.name).toBe(eventData.name);
      expect(event.slug).toBe(eventData.slug);
      expect(event.description).toBe(eventData.description);
      expect(event.userId).toBe(testUserId);

      // Save event ID for further tests
      createdEventId = event.id;
    });

    it('should update the created event as test user', async () => {
      expect(createdEventId).toBeDefined();

      const updateData = {
        name: 'Test Conference 2026 - Updated',
        description: 'This is an updated description for the test event.',
      };

      const response = await request(app.getHttpServer())
        .patch(`/events/${createdEventId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200);

      const event = response.body as EventResponse;
      expect(event.id).toBe(createdEventId);
      expect(event.name).toBe(updateData.name);
      expect(event.description).toBe(updateData.description);
      expect(event.slug).toBe('test-conference-2026'); // Slug bleibt gleich
    });

    it('should get the created event by ID', async () => {
      expect(createdEventId).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/events/${createdEventId}`)
        .set('Authorization', `Bearer ${testUserToken}`) // Auth needed to see own unpublished event
        .expect(200);

      const event = response.body as EventResponse;
      expect(event.id).toBe(createdEventId);
      expect(event.name).toBe('Test Conference 2026 - Updated');
    });

    it('should get all events created by test user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/user/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      // findByUser returns an array (not paginated)
      const events = response.body as EventResponse[];
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);

      const testEvent = events.find((event) => event.id === createdEventId);
      expect(testEvent).toBeDefined();
      expect(testEvent?.userId).toBe(testUserId);
    });

    it('should delete the created event as test user', async () => {
      expect(createdEventId).toBeDefined();

      await request(app.getHttpServer())
        .delete(`/events/${createdEventId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(204);
    });

    it('should return 404 when trying to get the deleted event', async () => {
      expect(createdEventId).toBeDefined();

      await request(app.getHttpServer())
        .get(`/events/${createdEventId}`)
        .expect(404);
    });
  });

  describe('Event Validation and Authorization', () => {
    it('should fail to create event without authentication', async () => {
      const eventData = {
        name: 'Unauthorized Event',
        slug: 'unauthorized-event',
        dateStart: '2026-12-01T09:00:00Z',
        dateEnd: '2026-12-01T18:00:00Z',
        description: 'This should fail without authentication.',
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .expect(401);
    });

    it('should fail to create event with invalid data', async () => {
      const invalidEventData = {
        name: 'AB', // Zu kurz (min 3 Zeichen)
        slug: 'invalid-slug',
        dateStart: '2026-12-01T09:00:00Z',
        dateEnd: '2026-12-01T18:00:00Z',
        description: 'Valid description for testing.',
      };

      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(invalidEventData)
        .expect(400);
    });

    it('should fail to create event with duplicate slug', async () => {
      // Erstelle erstes Event
      const eventData = {
        name: 'Duplicate Slug Test',
        slug: 'duplicate-slug-test',
        dateStart: '2026-12-15T09:00:00Z',
        dateEnd: '2026-12-15T18:00:00Z',
        description: 'First event with this slug.',
      };

      const firstEvent = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(eventData)
        .expect(201);

      // Try to create event with same slug - should return 409
      const duplicateEventData = {
        ...eventData,
        name: 'Another Event',
      };

      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(duplicateEventData)
        .expect(409);

      // Cleanup: Delete first event
      const firstEventData = firstEvent.body as EventResponse;
      await request(app.getHttpServer())
        .delete(`/events/${firstEventData.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(204);
    });
  });

  describe('Unpublished visibility and publish permissions', () => {
    beforeAll(async () => {
      visibilityEventSlug = `visibility-check-${Date.now()}`;
      visibilitySearchToken = `visibility-token-${Date.now()}`;

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: `Visibility Check Event ${visibilitySearchToken}`,
          slug: visibilityEventSlug,
          dateStart: '2026-12-20T09:00:00Z',
          dateEnd: '2026-12-20T18:00:00Z',
          description:
            `Unpublished visibility check event for resource-owner tests. ${visibilitySearchToken}`,
        })
        .expect(201);

      const event = response.body as EventResponse;
      visibilityEventId = event.id;
      expect(event.published).toBe(false);
      expect(event.userId).toBe(testUserId);
    });

    afterAll(async () => {
      if (visibilityEventId) {
        await prisma.event.deleteMany({
          where: { id: visibilityEventId },
        });
      }
    });

    it('should allow resource owner to read own unpublished event by slug', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/slug/${visibilityEventSlug}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      const event = response.body as EventResponse;
      expect(event.id).toBe(visibilityEventId);
      expect(event.userId).toBe(testUserId);
      expect(event.published).toBe(false);
    });

    it('should include owners unpublished event in GET /events listing for the owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events?search=${encodeURIComponent(visibilitySearchToken)}&page=1&limit=50`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      const data = response.body as { data: EventResponse[] };
      const list = Array.isArray(data?.data) ? data.data : [];
      expect(list.some((e) => e.id === visibilityEventId)).toBe(true);
    });

    it('should NOT include unpublished event in GET /events listing for unauthenticated users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events?search=${encodeURIComponent(visibilitySearchToken)}&page=1&limit=50`)
        .expect(200);

      const data = response.body as { data: EventResponse[] };
      const list = Array.isArray(data?.data) ? data.data : [];
      expect(list.some((e) => e.id === visibilityEventId)).toBe(false);
    });

    it('should include unpublished event in GET /events listing for moderators', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events?search=${encodeURIComponent(visibilitySearchToken)}&page=1&limit=50`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      const data = response.body as { data: EventResponse[] };
      const list = Array.isArray(data?.data) ? data.data : [];
      expect(list.some((e) => e.id === visibilityEventId)).toBe(true);
    });

    it('should hide unpublished event from unauthenticated users', async () => {
      await request(app.getHttpServer())
        .get(`/events/slug/${visibilityEventSlug}`)
        .expect(404);
    });

    it('should allow moderator to read another users unpublished event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/slug/${visibilityEventSlug}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      const event = response.body as EventResponse;
      expect(event.id).toBe(visibilityEventId);
      expect(event.published).toBe(false);
    });

    it('should reject publish action for regular users', async () => {
      await request(app.getHttpServer())
        .patch(`/events/${visibilityEventId}/publish`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ published: true })
        .expect(403);
    });

    it('should allow moderator to publish event', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/events/${visibilityEventId}/publish`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ published: true })
        .expect(200);

      const event = response.body as EventResponse;
      expect(event.id).toBe(visibilityEventId);
      expect(event.published).toBe(true);
    });

    it('should expose published event to unauthenticated users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/slug/${visibilityEventSlug}`)
        .expect(200);

      const event = response.body as EventResponse;
      expect(event.id).toBe(visibilityEventId);
      expect(event.published).toBe(true);
    });

    it('should include published event in GET /events listing for unauthenticated users after publishing', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events?search=${encodeURIComponent(visibilitySearchToken)}&page=1&limit=50`)
        .expect(200);

      const data = response.body as { data: EventResponse[] };
      const list = Array.isArray(data?.data) ? data.data : [];
      expect(list.some((e) => e.id === visibilityEventId && e.published === true)).toBe(true);
    });
  });
});
