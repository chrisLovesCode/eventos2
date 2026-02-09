import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { AuthResponse, AdminStatsResponse } from './types/test-types';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let adminEmail: string;
  let adminPassword: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const configService = app.get(ConfigService);
    adminEmail = configService.get<string>('ADMIN_EMAIL') ?? '';
    adminPassword = configService.get<string>('ADMIN_PASSWORD') ?? '';

    await app.init();

    // Login to get admin JWT token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminEmail,
        password: adminPassword,
      });

    const authBody = loginResponse.body as AuthResponse;
    adminToken = authBody.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/admin (GET)', () => {
    it('should allow admin to access endpoint', () => {
      return request(app.getHttpServer())
        .get('/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as AdminStatsResponse;
          expect(body).toHaveProperty('message');
          expect(body).toHaveProperty('stats');
          expect(body.stats).toHaveProperty('totalUsers');
          expect(body.stats).toHaveProperty('totalAdmins');
          expect(typeof body.stats.totalUsers).toBe('number');
          expect(typeof body.stats.totalAdmins).toBe('number');
        });
    });

    it('should deny access without authentication token', () => {
      return request(app.getHttpServer()).get('/admin').expect(401);
    });

    it('should deny access with invalid token', () => {
      return request(app.getHttpServer())
        .get('/admin')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });

    it('should deny access with expired token', () => {
      // JWT token that expired (created with 1 second expiration)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.4Adcj0u6gqXnhqQbFD9hLa6a6vYOLbqEqKqQ8XQiZ9Y';

      return request(app.getHttpServer())
        .get('/admin')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('Role-based authorization', () => {
    it('should return stats with correct counts', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as AdminStatsResponse;
      // At least 1 admin should exist (the one created on startup)
      expect(body.stats.totalAdmins).toBeGreaterThanOrEqual(1);
      expect(body.stats.totalUsers).toBeGreaterThanOrEqual(1);
    });
  });
});
