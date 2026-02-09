import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memoryHealth: MemoryHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @SkipThrottle()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint with system metrics' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    return this.health.check([
      // Database connectivity check
      () => this.prismaHealth.pingCheck('database', this.prisma),
      // Memory heap check - should not exceed 300MB
      () => this.memoryHealth.checkHeap('memory_heap', 300 * 1024 * 1024),
      // Memory RSS check - should not exceed 300MB
      () => this.memoryHealth.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }
}
