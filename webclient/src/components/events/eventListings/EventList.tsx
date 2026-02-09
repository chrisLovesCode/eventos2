import { headers } from "next/headers";
import { InfiniteEventList } from "./InfiniteEventList";
import type { Category, Event, PaginatedResponse } from "@/types/event";

interface EventListProps {
  page?: number;
  limit?: number;
  categorySlugs?: string[];
  searchQuery?: string;
  layout?: "grid" | "withSidebar";
  showFilters?: boolean;
}

async function fetchEvents(
  frontendBaseUrl: string,
  cookieHeader: string | undefined,
  page: number = 1,
  limit: number = 10,
  categorySlugs: string[] = [],
  searchQuery?: string
): Promise<PaginatedResponse<Event>> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy: "dateStart",
      sortOrder: "asc",
    });

    if (categorySlugs.length > 0) {
      params.set("categorySlugs", categorySlugs.join(","));
    }

    if (searchQuery) {
      params.set("search", searchQuery);
    }

    const response = await fetch(
      `${frontendBaseUrl}/api/events?${params.toString()}`,
      {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        // No cache to see new events immediately
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Events API error:", response.status, errorText);
      throw new Error(`Fehler beim Laden der Events: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Events fetch error:", error);
    throw error;
  }
}

async function fetchCategories(
  frontendBaseUrl: string,
  cookieHeader: string | undefined
): Promise<Category[]> {
  try {
    const response = await fetch(
      `${frontendBaseUrl}/api/categories`,
      {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      throw new Error("Fehler beim Laden der Kategorien");
    }

    return await response.json();
  } catch (error) {
    console.error("Categories fetch error:", error);
    return [];
  }
}

async function getFrontendBaseUrl(): Promise<string> {
  // When running inside Docker, the browser hits the container via a mapped host port (e.g. 3001),
  // but the Next.js server itself listens on 3000 inside the container. Using the Host header
  // would produce an unreachable URL like http://localhost:3001 from within the container.
  if (process.env.DOCKER_ENV === "true") {
    return "http://localhost:3000";
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.FRONTEND_URL || "http://localhost:3001";
}

export async function EventList({
  page = 1,
  limit = 10,
  categorySlugs = [],
  searchQuery,
  layout = "grid",
  showFilters = true,
}: EventListProps) {
  let events: Event[] = [];
  let meta: PaginatedResponse<Event>["meta"] | null = null;
  let error: string | null = null;
  let categories: Category[] = [];

  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? undefined;
  const frontendBaseUrl = await getFrontendBaseUrl();

  try {
    const [eventsData, categoriesData] = await Promise.all([
      fetchEvents(frontendBaseUrl, cookieHeader, page, limit, categorySlugs, searchQuery),
      showFilters
        ? fetchCategories(frontendBaseUrl, cookieHeader)
        : Promise.resolve([]),
    ]);
    const data = eventsData;
    events = data.data;
    meta = data.meta;
    categories = categoriesData;
  } catch (err) {
    error = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten";
  }

  if (error) {
    return (
      <div className="status-error">
        <p className="font-medium">Fehler beim Laden der Events</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <InfiniteEventList
      initialEvents={events}
      initialTotal={meta?.total || 0}
      categories={categories}
      categorySlugs={categorySlugs}
      searchQuery={searchQuery}
      layout={layout}
      showFilters={showFilters}
    />
  );
}
