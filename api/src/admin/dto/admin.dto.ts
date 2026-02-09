import { ApiProperty } from '@nestjs/swagger';

class AdminStats {
  @ApiProperty({
    example: 5,
    description: 'Total number of users in the system',
  })
  totalUsers: number;

  @ApiProperty({
    example: 1,
    description: 'Total number of admin users',
  })
  totalAdmins: number;
}

export class AdminStatsResponseDto {
  @ApiProperty({
    example: 'Hello Admin',
    description: 'Welcome message',
  })
  message: string;

  @ApiProperty({
    type: AdminStats,
    description: 'System statistics',
  })
  stats: AdminStats;
}
