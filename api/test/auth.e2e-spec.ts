import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { AuthResponse } from './types/test-types';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let adminEmail: string;
  let adminPassword: string;

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

    configService = app.get(ConfigService);
    adminEmail = configService.get<string>('ADMIN_EMAIL') ?? '';
    adminPassword = configService.get<string>('ADMIN_PASSWORD') ?? '';

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return JWT token when admin logs in with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as AuthResponse;
          expect(body).toHaveProperty('access_token');
          expect(body.access_token).toBeDefined();
          expect(typeof body.access_token).toBe('string');

          expect(body).toHaveProperty('user');
          expect(body.user.email).toBe(adminEmail);
          expect(body.user.role).toBe('ADMIN');
          expect(body.user).toHaveProperty('id');
          expect(body.user).toHaveProperty('nick');
        });
    });

    it('should return 401 when login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: 'wrongPassword',
        })
        .expect(401);
    });

    it('should return 401 when login with non-existing email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexisting@example.com',
          password: adminPassword,
        })
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should rotate refresh token and invalidate old refresh token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200);

      const loginBody = loginResponse.body as AuthResponse;
      expect(loginBody.refresh_token).toBeDefined();

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.refresh_token}`)
        .expect(200);

      const refreshBody = refreshResponse.body as AuthResponse;
      expect(refreshBody.refresh_token).toBeDefined();
      expect(refreshBody.refresh_token).not.toBe(loginBody.refresh_token);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.refresh_token}`)
        .expect(401);
    });
  });
});
