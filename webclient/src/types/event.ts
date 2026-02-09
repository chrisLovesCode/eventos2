export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface UserBasic {
  id: string;
  email: string;
  nick: string | null;
  role: string;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  dateStart: string;
  dateEnd: string | null;
  description: string | null;
  banner: string | null;
  userId: string | null;
  categoryId: string | null;
  category?: Category | null;
  user?: UserBasic;
  published?: boolean;
  orgaName?: string | null;
  orgaWebsite?: string | null;
  eventWebsite?: string | null;
  eventAddress?: string | null;
  registrationLink?: string | null;
  isOnlineEvent?: boolean;
  tags?: string[];
  latitude?: number | null;
  longitude?: number | null;
  distance?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}
