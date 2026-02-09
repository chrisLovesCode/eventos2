'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Header, Footer } from "@/components/layout";
import { EventDetailFormWrapper } from "@/components/events/EventForm/EventDetailFormWrapper";
import { EventShare } from "@/components/events/EventShare";
import type { Event } from "@/types/event";

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        const response = await fetch(`/api/events/slug/${slug}`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Event nicht gefunden");
          } else {
            setError("Fehler beim Laden des Events");
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setEvent(data);
      } catch (err) {
        console.error("Event fetch error:", err);
        setError("Fehler beim Laden des Events");
      } finally {
        setIsLoading(false);
      }
    }

    loadEvent();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="mx-auto max-w-7xl px-4 pt-28 pb-8 sm:px-6 sm:pt-32 lg:px-8">
          <div className="text-center">Lädt...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <main className="mx-auto max-w-7xl px-4 pt-28 pb-8 sm:px-6 sm:pt-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {error || "Event nicht gefunden"}
            </h1>
            <Link href="/" className="text-primary hover:underline">
              Zurück zur Startseite
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pt-28 pb-8 sm:px-6 sm:pt-32 lg:px-8">
        {/* Event banner with date and title */}
        <div 
          className="event-banner"
          style={{
            backgroundImage: `url(${event.banner || '/bg-vr.png'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Datum-Box oben links */}
          <div className="absolute left-6 top-6 date-badge-surface">
            <span className="text-4xl font-bold leading-none text-foreground">
              {new Date(event.dateStart).getDate()}
            </span>
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {new Date(event.dateStart).toLocaleString("de-DE", { month: "short" }).toUpperCase()}
              {!new Date(event.dateStart).toLocaleString("de-DE", { month: "short" }).endsWith(".") && "."}
            </span>
          </div>

          {/* Event-Titel unten im Bild */}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/95 via-background/70 to-transparent p-8 pt-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              {event.name}
            </h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main Content Area */}
          <article className="card-sidebar p-8">
            <EventDetailFormWrapper event={event} />
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Kategorie */}
            {event.category && (
              <div className="card-sidebar">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Veranstaltungskategorie
                </h3>
                <Link
                  href={`/?categorySlugs=${event.category.slug}`}
                  className="glass-button"
                >
                  {event.category.name}
                </Link>
              </div>
            )}

            {/* Share With Friends */}
            <EventShare event={event} />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
