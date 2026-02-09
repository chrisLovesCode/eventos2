import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { login } from './utils/auth';
import { UserResponse, ErrorResponse, AuthResponse } from './types/test-types';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let adminToken: string;
  let userToken: string;
  let moderatorToken: string;
  let adminId: string;
  let userId: string;
  let moderatorId: string;

  const testUserEmail = 'testuser@example.dev';
  const testUserPassword = 'changeMe';

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

    prisma = app.get(PrismaService);
    authService = app.get(AuthService);
    const configService = app.get(ConfigService);

    // Login als Admin
    const adminEmail = configService.get<string>('ADMIN_EMAIL');
    const adminPassword = configService.get<string>('ADMIN_PASSWORD');

    const adminLoginResponse = await login(app, adminEmail, adminPassword);

    adminToken = adminLoginResponse.token;
    adminId = adminLoginResponse.user.id;

    // Login als Testuser
    const userLoginResponse = await login(app, testUserEmail, testUserPassword);

    userToken = userLoginResponse.token;
    userId = userLoginResponse.user.id;

    // Erstelle Moderator direkt in DB
    const hashedPassword = await authService.hashPassword('test1234');
    const moderator = await prisma.user.create({
      data: {
        email: 'moderator-test@example.dev',
        password: hashedPassword,
        nick: 'ModeratorTest',
        role: 'MODERATOR',
        emailVerified: true,
        isActive: true,
      },
    });

    moderatorId = moderator.id;

    // Moderator Login
    const modLoginResponse = await login(
      app,
      'moderator-test@example.dev',
      'test1234',
    );

    moderatorToken = modLoginResponse.token;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: 'moderator-test@example.dev' },
    });
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const user = response.body as UserResponse;
      expect(user.id).toBe(userId);
      expect(user.email).toBe(testUserEmail);
      expect(user).not.toHaveProperty('password');
    });
  });

  describe('PATCH /users/me', () => {
    it('should update own profile', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nick: 'UpdatedTestUser' })
        .expect(200);

      const user = response.body as UserResponse;
      expect(user.nick).toBe('UpdatedTestUser');
    });

    it('should not allow user to change their own role', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'ADMIN' })
        .expect(403);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });
  });

  describe('PATCH /users/:id', () => {
    it('should allow admin to update any user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nick: 'AdminUpdatedNick' })
        .expect(200);

      const user = response.body as UserResponse;
      expect(user.nick).toBe('AdminUpdatedNick');
    });

    it('should allow admin to change user role', async () => {
      // Create temp user
      const hashedPassword = await authService.hashPassword('test1234');
      const tempUser = await prisma.user.create({
        data: {
          email: 'temp@test.dev',
          password: hashedPassword,
          nick: 'TempUser',
          role: 'USER',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'MODERATOR' })
        .expect(200);

      const updatedUser = response.body as UserResponse;
      expect(updatedUser.role).toBe('MODERATOR');

      // Cleanup
      await prisma.user.delete({ where: { id: tempUser.id } });
    });

    it('should not allow user to update other users', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${moderatorId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nick: 'HackedNick' })
        .expect(403);
    });
  });

  describe('DELETE /users/:id - Moderator Protection', () => {
    it('should NOT allow moderator to delete admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${adminId}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);

      const error = response.body as ErrorResponse;
      expect(error.message).toContain('Moderators cannot modify admin users');
    });

    it('should allow moderator to delete regular user', async () => {
      // Create temp user
      const timestamp = Date.now();
      const tempUser = await prisma.user.create({
        data: {
          email: `deleteme-${timestamp}@test.dev`,
          password: 'hashed',
          nick: `DeleteMe-${timestamp}`,
          role: 'USER',
        },
      });

      await request(app.getHttpServer())
        .delete(`/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(204);
    });

    it('should allow admin to delete any user', async () => {
      // Create temp user
      const timestamp = Date.now();
      const tempUser = await prisma.user.create({
        data: {
          email: `deleteme-${timestamp}@test.dev`,
          password: 'hashed',
          nick: `DeleteMe-${timestamp}`,
          role: 'USER',
        },
      });

      await request(app.getHttpServer())
        .delete(`/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should allow user to delete their own account', async () => {
      // Cleanup any existing selfdelete user
      await prisma.user.deleteMany({
        where: { email: 'selfdelete@test.dev' },
      });

      // Create temp user and get token
      const hashedPassword = await authService.hashPassword('test1234');
      const tempUser = await prisma.user.create({
        data: {
          email: 'selfdelete@test.dev',
          password: hashedPassword,
          nick: 'SelfDelete',
          role: 'USER',
          emailVerified: true,
          isActive: true,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'selfdelete@test.dev',
          password: 'test1234',
        });

      const authBody = loginResponse.body as AuthResponse;
      const tempToken = authBody.access_token;

      await request(app.getHttpServer())
        .delete(`/users/${tempUser.id}`)
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(204);
    });
  });
});
