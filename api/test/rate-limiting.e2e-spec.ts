import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { AuthResponse } from './types/test-types';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;
  let adminEmail: string;

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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Login endpoint rate limiting', () => {
    it('should allow up to 5 login attempts', async () => {
      // Make 5 requests - all should go through (some will fail auth, but not rate limited)
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: adminEmail,
            password: 'wrong-password',
          });

        // Should get 401 Unauthorized, NOT 429 Too Many Requests
        expect(response.status).toBe(401);
      }
    });

    it('should block 6th login attempt with 429 Too Many Requests', async () => {
      // Make 5 requests first
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post('/auth/login').send({
          email: adminEmail,
          password: 'wrong-password',
        });
      }

      // 6th request should be rate limited
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: 'wrong-password',
        });

      expect(response.status).toBe(429);
    });

    it('should return 429 status code when rate limited', async () => {
      // Make 5 requests first
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post('/auth/login').send({
          email: adminEmail,
          password: 'wrong-password',
        });
      }

      // 6th request should be rate limited
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: 'wrong-password',
        });

      expect(response.status).toBe(429);
    });
  });

  describe('Global rate limiting', () => {
    it('should apply rate limiting to authenticated endpoints', async () => {
      // Get a valid token first
      const configService = app.get(ConfigService);
      const adminPassword = configService.get<string>('ADMIN_PASSWORD');

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
        });

      const authBody = loginResponse.body as AuthResponse;
      const token = authBody.access_token;

      // Make 30 requests to admin endpoint (admin rate limit is 30/min)
      for (let i = 0; i < 30; i++) {
        await request(app.getHttpServer())
          .get('/admin')
          .set('Authorization', `Bearer ${token}`);
      }

      // 31st request should be rate limited
      const response = await request(app.getHttpServer())
        .get('/admin')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(429);
    });
  });

  describe('Health endpoint behavior', () => {
    it('should respond to health check requests', async () => {
      // Make a single health check request
      const response = await request(app.getHttpServer()).get('/health');

      // Should return either 200 (healthy) or 503 (unhealthy), but not 404
      expect([200, 503]).toContain(response.status);
    });
  });
});
