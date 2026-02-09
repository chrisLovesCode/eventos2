import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HealthResponse } from './types/test-types';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return 200 when service is healthy', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          const health = res.body as HealthResponse;
          expect(health).toHaveProperty('status');
          expect(health.status).toBe('ok');
          expect(health).toHaveProperty('info');
          expect(health).toHaveProperty('details');
        });
    });

    it('should check database connectivity', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          const health = res.body as HealthResponse;
          expect(health.details).toHaveProperty('database');
          expect(health.details?.database).toHaveProperty('status');
          const dbStatus = health.details?.database as { status: string };
          expect(dbStatus.status).toBe('up');
        });
    });

    it('should be publicly accessible without authentication', () => {
      // No Authorization header required
      return request(app.getHttpServer()).get('/health').expect(200);
    });

    it('should respond quickly (< 1 second)', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer()).get('/health').expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should return consistent response structure', async () => {
      const response1 = await request(app.getHttpServer()).get('/health');
      const response2 = await request(app.getHttpServer()).get('/health');

      const health1 = response1.body as Record<string, unknown>;
      const health2 = response2.body as Record<string, unknown>;
      expect(Object.keys(health1).sort()).toEqual(Object.keys(health2).sort());
    });
  });
});
