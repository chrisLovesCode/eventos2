import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type LoginResult = {
  token: string;
  user: {
    id: string;
    email: string;
    nick: string;
    role: string;
  };
};

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoginResult> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const body = response.body as {
    access_token: string;
    user: { id: string; email: string; nick: string; role: string };
  };

  return {
    token: body.access_token,
    user: body.user,
  };
}
