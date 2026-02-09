import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { Role } from '@prisma/client';

/**
 * Service to initialize admin user on application startup
 * Creates default admin user from environment variables if not exists
 */
@Injectable()
export class AdminInitService implements OnModuleInit {
  private readonly logger = new Logger(AdminInitService.name);

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createAdminUser();
  }

  /**
   * Creates admin user from environment variables if not already exists
   * @private
   */
  private async createAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminNick = this.configService.get<string>('ADMIN_NICK');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminNick || !adminPassword) {
      this.logger.warn('Admin configuration missing in environment variables');
      return;
    }

    try {
      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        // Ensure admin can log in even if created without email verification
        if (!existingAdmin.emailVerified) {
          await this.prisma.user.update({
            where: { id: existingAdmin.id },
            data: {
              emailVerified: true,
              emailVerifiedAt: existingAdmin.emailVerifiedAt ?? new Date(),
            },
          });
          this.logger.log('Admin user email verified');
        } else {
          this.logger.log('Admin user already exists');
        }
        return;
      }

      const hashedPassword = await this.authService.hashPassword(adminPassword);

      const admin = await this.prisma.user.create({
        data: {
          email: adminEmail,
          nick: adminNick,
          password: hashedPassword,
          role: Role.ADMIN,
          isActive: true,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          tokenVersion: 0,
        },
      });

      this.logger.log(`Admin user created successfully: ${admin.email}`);
    } catch (error) {
      this.logger.error(
        `Error creating admin user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
