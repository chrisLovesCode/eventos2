import type { Event, PaginatedResponse, UserBasic } from "@/types/event";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000;

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Custom fetch wrapper with timeout and error handling
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = API_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
    throw new Error("Unknown error occurred");
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Type-safe API client for Eventos2 backend
 */
export const api = {
  auth: {
    login: (credentials: LoginDto) =>
      fetchAPI<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
  },
  events: {
    getAll: (params?: EventFilterParams) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.search) searchParams.set("search", params.search);
      if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
      if (params?.dateTo) searchParams.set("dateTo", params.dateTo);
      if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
      if (params?.includeUser !== undefined) searchParams.set("includeUser", params.includeUser.toString());
      
      const queryString = searchParams.toString();
      return fetchAPI<PaginatedResponse<Event>>(
        `/events${queryString ? `?${queryString}` : ""}`
      );
    },
    getById: (id: string) => fetchAPI<Event>(`/events/${id}`),
    create: (data: CreateEventDto) =>
      fetchAPI<Event>("/events", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateEventDto) =>
      fetchAPI<Event>(`/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI<void>(`/events/${id}`, {
        method: "DELETE",
      }),
  },
};

// nd DTOs)
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: UserBasic;
}

export interface EventFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "dateStart" | "dateEnd" | "createdAt" | "name";
  sortOrder?: "asc" | "desc";
  includeUser?: boolean;
}

export interface CreateEventDto {
  name: string;
  slug: string;
  dateStart: string;
  dateEnd?: string;
  description?: string;
}

export interface UpdateEventDto {
  name?: string;
  slug?: string;
  dateStart?: string;
  dateEnd?: string;
  description?: string;
}
