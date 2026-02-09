"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { EventCard } from "./EventCard";
import { SearchFilterCard } from "./SearchFilterCard";
import type { LocationSearchParams } from "../../locationSearch/LocationSearch";
import type { Category, Event } from "@/types/event";

interface InfiniteEventListProps {
  initialEvents: Event[];
  initialTotal: number;
  categories: Category[];
  categorySlugs: string[];
  searchQuery?: string;
  layout?: "grid" | "withSidebar";
  showFilters?: boolean;
}

export function InfiniteEventList({
  initialEvents,
  initialTotal,
  categories,
  categorySlugs,
  searchQuery,
  layout = "grid",
  showFilters = true,
}: InfiniteEventListProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialEvents.length < initialTotal);
  const [mounted, setMounted] = useState(false);
  const [locationParams, setLocationParams] = useState<LocationSearchParams | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadMoreEvents = useCallback(async () => {
    if (inFlightRef.current || isLoading || !hasMore) return;

    inFlightRef.current = true;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: "10",
        sortBy: "dateStart",
        sortOrder: "asc",
      });

      if (categorySlugs.length > 0) {
        params.set("categorySlugs", categorySlugs.join(","));
      }

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      // Add location parameters if active
      if (locationParams) {
        if (locationParams.latitude !== undefined) {
          params.set("latitude", String(locationParams.latitude));
        }
        if (locationParams.longitude !== undefined) {
          params.set("longitude", String(locationParams.longitude));
        }
        if (locationParams.radius !== undefined) {
          params.set("radius", String(locationParams.radius));
        }
        if (locationParams.postalCode) {
          params.set("postalCode", locationParams.postalCode);
        }
      }

      const response = await fetch(`/api/events?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Fehler beim Laden weiterer Events");
      }

      const data = await response.json();
      const newEvents = data.data;

      setEvents((prev) => {
        const totalLoaded = prev.length + newEvents.length;
        setHasMore(totalLoaded < data.meta.total);
        
        console.log("Loaded events:", {
          newCount: newEvents.length,
          totalLoaded,
          totalAvailable: data.meta.total,
          hasMore: totalLoaded < data.meta.total
        });
        
        return [...prev, ...newEvents];
      });
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Fehler beim Laden weiterer Events:", error);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [page, isLoading, hasMore, categorySlugs, searchQuery, locationParams]);

  const handleLocationChange = useCallback(async (params: LocationSearchParams) => {
    setLocationParams(params);
    setIsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: "1",
        limit: "10",
        sortBy: "distance",
        sortOrder: "asc",
      });

      if (categorySlugs.length > 0) {
        queryParams.set("categorySlugs", categorySlugs.join(","));
      }

      if (searchQuery) {
        queryParams.set("search", searchQuery);
      }

      if (params.latitude !== undefined) {
        queryParams.set("latitude", String(params.latitude));
      }
      if (params.longitude !== undefined) {
        queryParams.set("longitude", String(params.longitude));
      }
      if (params.radius !== undefined) {
        queryParams.set("radius", String(params.radius));
      }
      if (params.postalCode) {
        queryParams.set("postalCode", params.postalCode);
      }

      const response = await fetch(`/api/events?${queryParams.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Events");
      }

      const data = await response.json();
      setEvents(data.data);
      setPage(1);
      setHasMore(data.data.length < data.meta.total);
    } catch (error) {
      console.error("Fehler beim Laden der Events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [categorySlugs, searchQuery]);

  const handleLocationClear = useCallback(async () => {
    setLocationParams(null);
    setEvents(initialEvents);
    setPage(1);
    setHasMore(initialEvents.length < initialTotal);
  }, [initialEvents, initialTotal]);

  useEffect(() => {
    // Reset when filters change
    setEvents(initialEvents);
    setPage(1);
    setHasMore(initialEvents.length < initialTotal);
  }, [categorySlugs, searchQuery, initialEvents, initialTotal]);

  useEffect(() => {
    if (!mounted) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        
        // Only trigger if actually intersecting and not already loading
        if (entry.isIntersecting && !inFlightRef.current) {
          loadMoreEvents();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: "100px"
      }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [mounted, loadMoreEvents]);

  const emptyState = (
    <div className="card-sidebar p-12 text-center">
      <svg
        className="mx-auto h-12 w-12 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-foreground">
        Keine Events vorhanden
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {searchQuery
          ? `Keine Events für "${searchQuery}" gefunden.`
          : categorySlugs.length > 0
          ? "Keine Events für die gewählten Kategorien gefunden."
          : "Es wurden noch keine Events erstellt."}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search & Filter Card with Tabs */}
      {mounted && showFilters && (
        <SearchFilterCard
          categories={categories}
          selectedCategorySlugs={categorySlugs}
          onLocationChange={handleLocationChange}
          onLocationClear={handleLocationClear}
        />
      )}

      {events.length === 0 ? (
        emptyState
      ) : (
        <>
          {/* Cards Ansicht */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Weitere Events werden geladen...</span>
              </div>
            )}
            {!hasMore && events.length > 0 && (
              <p className="text-sm text-white font-bold text-shadow-2xs">
                Alle Events geladen
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
