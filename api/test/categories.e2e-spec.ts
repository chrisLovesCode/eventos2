import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { login } from './utils/auth';

interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  eventCount?: number;
}

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminUserId: string;
  let testUserToken: string;
  let testUserId: string;
  let createdCategoryId: string;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.dev';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeMe';
  const testUserEmail = 'testuser@example.dev';
  const testUserPassword = 'changeMe';

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

    // Login als Admin
    const adminLoginResponse = await login(app, adminEmail, adminPassword);
    adminToken = adminLoginResponse.token;
    adminUserId = adminLoginResponse.user.id;
    expect(adminLoginResponse.user.role).toBe('ADMIN');

    // Login als Test User
    const testUserLoginResponse = await login(
      app,
      testUserEmail,
      testUserPassword,
    );
    testUserToken = testUserLoginResponse.token;
    testUserId = testUserLoginResponse.user.id;
    expect(testUserLoginResponse.user.role).toBe('USER');

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Cleanup: Lösche Test-Categories
    if (createdCategoryId) {
      await prisma.category
        .delete({
          where: { id: createdCategoryId },
        })
        .catch(() => {
          /* ignore if already deleted */
        });
    }
    await app.close();
  });

  describe('Public Endpoints', () => {
    it('should get all categories without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        const category = response.body[0] as CategoryResponse;
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
        expect(category).toHaveProperty('eventCount');
      }
    });

    it('should get category by ID without authentication', async () => {
      // Get first category from list
      const listResponse = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      if (listResponse.body.length > 0) {
        const categoryId = listResponse.body[0].id;
        const response = await request(app.getHttpServer())
          .get(`/categories/${categoryId}`)
          .expect(200);

        const category = response.body as CategoryResponse;
        expect(category.id).toBe(categoryId);
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
      }
    });

    it('should get category by slug without authentication', async () => {
      // Get first category from list
      const listResponse = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      if (listResponse.body.length > 0) {
        const categorySlug = listResponse.body[0].slug;
        const response = await request(app.getHttpServer())
          .get(`/categories/slug/${categorySlug}`)
          .expect(200);

        const category = response.body as CategoryResponse;
        expect(category.slug).toBe(categorySlug);
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('id');
      }
    });

    it('should return 404 for non-existing category ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/categories/${fakeId}`)
        .expect(404);
    });

    it('should return 404 for non-existing category slug', async () => {
      await request(app.getHttpServer())
        .get('/categories/slug/non-existing-slug-xyz')
        .expect(404);
    });
  });

  describe('Admin-Only Create', () => {
    it('should create a new category as admin', async () => {
      const categoryData = {
        name: 'Test Category E2E',
        slug: 'test-category-e2e',
      };

      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      const category = response.body as CategoryResponse;
      expect(category).toHaveProperty('id');
      expect(category.name).toBe(categoryData.name);
      expect(category.slug).toBe(categoryData.slug);
      expect(category.eventCount).toBe(0);

      // Save for cleanup
      createdCategoryId = category.id;
    });

    it('should not create category without authentication', async () => {
      const categoryData = {
        name: 'Unauthorized Category',
        slug: 'unauthorized-category',
      };

      await request(app.getHttpServer())
        .post('/categories')
        .send(categoryData)
        .expect(401);
    });

    it('should not create category as regular user', async () => {
      const categoryData = {
        name: 'User Category',
        slug: 'user-category',
      };

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(categoryData)
        .expect(403);
    });

    it('should return 409 when creating category with duplicate name', async () => {
      const categoryData = {
        name: 'Test Category E2E',
        slug: 'test-category-e2e-duplicate',
      };

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(409);
    });

    it('should return 409 when creating category with duplicate slug', async () => {
      const categoryData = {
        name: 'Test Category E2E Duplicate',
        slug: 'test-category-e2e',
      };

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(409);
    });

    it('should return 400 when creating category with invalid slug', async () => {
      const categoryData = {
        name: 'Invalid Slug Category',
        slug: 'Invalid Slug!',
      };

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(400);
    });

    it('should return 400 when creating category with missing name', async () => {
      const categoryData = {
        slug: 'missing-name',
      };

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(400);
    });

    it('should return 400 when creating category with missing slug', async () => {
      const categoryData = {
        name: 'Missing Slug',
      };

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(400);
    });
  });

  describe('Admin-Only Update', () => {
    it('should update category as admin', async () => {
      expect(createdCategoryId).toBeDefined();

      const updateData = {
        name: 'Test Category E2E - Updated',
      };

      const response = await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      const category = response.body as CategoryResponse;
      expect(category.id).toBe(createdCategoryId);
      expect(category.name).toBe(updateData.name);
      expect(category.slug).toBe('test-category-e2e'); // Slug unchanged
    });

    it('should update category slug as admin', async () => {
      expect(createdCategoryId).toBeDefined();

      const updateData = {
        slug: 'test-category-e2e-updated',
      };

      const response = await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      const category = response.body as CategoryResponse;
      expect(category.id).toBe(createdCategoryId);
      expect(category.slug).toBe(updateData.slug);
    });

    it('should not update category without authentication', async () => {
      expect(createdCategoryId).toBeDefined();

      const updateData = {
        name: 'Unauthorized Update',
      };

      await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .send(updateData)
        .expect(401);
    });

    it('should not update category as regular user', async () => {
      expect(createdCategoryId).toBeDefined();

      const updateData = {
        name: 'User Update',
      };

      await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 when updating non-existing category', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        name: 'Non-existing',
      };

      await request(app.getHttpServer())
        .patch(`/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 400 when updating with invalid slug', async () => {
      expect(createdCategoryId).toBeDefined();

      const updateData = {
        slug: 'Invalid Slug!',
      };

      await request(app.getHttpServer())
        .patch(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('Admin-Only Delete', () => {
    it('should not delete category without authentication', async () => {
      expect(createdCategoryId).toBeDefined();

      await request(app.getHttpServer())
        .delete(`/categories/${createdCategoryId}`)
        .expect(401);
    });

    it('should not delete category as regular user', async () => {
      expect(createdCategoryId).toBeDefined();

      await request(app.getHttpServer())
        .delete(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);
    });

    it('should delete category as admin', async () => {
      expect(createdCategoryId).toBeDefined();

      await request(app.getHttpServer())
        .delete(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/categories/${createdCategoryId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existing category', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Category Filtering in Events', () => {
    let testCategoryId: string;
    let testEventId: string;

    beforeAll(async () => {
      // Cleanup any existing test categories from previous runs
      await prisma.category.deleteMany({
        where: {
          slug: {
            in: ['filter-test-category', 'event-with-category-test'],
          },
        },
      });

      // Create test category
      const categoryData = {
        name: 'Filter Test Category',
        slug: 'filter-test-category',
      };

      const categoryResponse = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      testCategoryId = categoryResponse.body.id;

      // Create test event with category
      const eventData = {
        name: 'Event with Category',
        slug: 'event-with-category-test',
        dateStart: '2026-12-01T09:00:00Z',
        dateEnd: '2026-12-01T18:00:00Z',
        description: 'Test event for category filtering',
        categoryId: testCategoryId,
      };

      const eventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(eventData)
        .expect(201);

      testEventId = eventResponse.body.id;

      // Publish the event so it's visible in public queries
      await request(app.getHttpServer())
        .patch(`/events/${testEventId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ published: true })
        .expect(200);
    });

    afterAll(async () => {
      // Cleanup
      if (testEventId) {
        await prisma.event.delete({ where: { id: testEventId } }).catch(() => {
          /* ignore */
        });
      }
      if (testCategoryId) {
        await prisma.category
          .delete({ where: { id: testCategoryId } })
          .catch(() => {
            /* ignore */
          });
      }
    });

    it('should filter events by categoryId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events?categoryId=${testCategoryId}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const event = response.body.data[0];
      expect(event.categoryId).toBe(testCategoryId);
    });

    it('should return event with category details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${testEventId}`)
        .expect(200);

      const event = response.body;
      expect(event.categoryId).toBe(testCategoryId);
      expect(event.category).toBeDefined();
      expect(event.category.id).toBe(testCategoryId);
      expect(event.category.name).toBe('Filter Test Category');
    });
  });

  describe('Query Parameters', () => {
    it('should return categories without event count when includeEventCount=false', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories?includeEventCount=false')
        .expect(200);

      if (response.body.length > 0) {
        const category = response.body[0] as CategoryResponse;
        expect(category.eventCount).toBeUndefined();
      }
    });

    it('should return categories with event count by default', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      if (response.body.length > 0) {
        const category = response.body[0] as CategoryResponse;
        expect(category).toHaveProperty('eventCount');
        expect(typeof category.eventCount).toBe('number');
      }
    });
  });
});
