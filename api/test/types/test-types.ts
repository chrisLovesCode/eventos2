// s
export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    nick: string;
    role: string;
  };
}

export interface EventResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    nick: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  nick: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminStatsResponse {
  stats: {
    totalUsers: number;
    totalEvents: number;
    activeUsers: number;
    deletedEvents: number;
  };
}

export interface HealthResponse {
  status: string;
  info?: Record<string, unknown>;
  error?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export interface ErrorResponse {
  message: string | string[];
  error?: string;
  statusCode: number;
}
