import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminStatsResponseDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats(): Promise<AdminStatsResponseDto> {
    const userCount = await this.prisma.user.count();
    const adminCount = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });

    return {
      message: 'Hello Admin',
      stats: {
        totalUsers: userCount,
        totalAdmins: adminCount,
      },
    };
  }

  // E2E Testing helper - Only use in test/dev environments!
  async verifyUserForTest(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    // Update user to verified
    await this.prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Delete any existing verification tokens
    await this.prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    return {
      message: `User ${email} has been verified successfully`,
    };
  }
}
