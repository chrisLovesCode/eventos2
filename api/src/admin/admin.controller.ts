import { Controller, Get, Post, Body, ForbiddenException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminStatsResponseDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(Role.ADMIN)
@Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute for admin
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin statistics' })
  @ApiResponse({
    status: 200,
    description: 'Admin statistics retrieved',
    type: AdminStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getHello(): Promise<AdminStatsResponseDto> {
    return this.adminService.getAdminStats();
  }

  // E2E Testing endpoint - Only enable in test/dev environments!
  @Post('test/verify-user')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: '[TEST ONLY] Verify user email for E2E tests' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyUserForTest(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    // Only allow in non-production environments
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ENABLE_TEST_ENDPOINTS !== 'true'
    ) {
      throw new ForbiddenException('Test endpoints are disabled in production');
    }

    return this.adminService.verifyUserForTest(email);
  }
}
