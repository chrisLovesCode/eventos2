import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { CategoriesModule } from './categories/categories.module';
import { FilesModule } from './files/files.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AdminInitService } from './common/admin-init.service';
import { UsersModule } from './users/users.module';

const isThrottleDisabled = process.env.DISABLE_THROTTLE === 'true';

const envFilePath =
  process.env.NODE_ENV === 'test'
    ? ['.env.test.local', '.env.test', '.env.test.example', '.env.local', '.env']
    : ['.env.local', '.env'];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    ...(isThrottleDisabled
      ? []
      : [
          ThrottlerModule.forRoot([
            {
              ttl: 60000, // 1 minute
              limit: 10, // 10 requests per minute
            },
          ]),
        ]),
    PrismaModule,
    AuthModule,
    AdminModule,
    HealthModule,
    EventsModule,
    CategoriesModule,
    UsersModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AdminInitService,
    ...(!isThrottleDisabled
      ? [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]
      : []),
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
