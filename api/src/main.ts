import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  // Serve static files from uploads directory
  // In dev mode: __dirname = /app/src, in prod: __dirname = /app/dist
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });
  logger.log(`📁 Serving static files from: ${uploadsPath}`);

  // Security Headers
  app.use(helmet());
  app.use(cookieParser());

  // CORS Konfiguration
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS')
    ?.split(',')
    .filter(Boolean) || ['http://localhost:3001'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('Eventos2 API')
    .setDescription('API documentation for Eventos2 event management system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`API is running on port ${port}`);
  logger.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
