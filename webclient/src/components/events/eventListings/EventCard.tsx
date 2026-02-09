import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { Clock, MapPin } from "lucide-react";
import type { Event } from "@/types/event";
import { Button } from "@/components/commons";
import { UnpublishedBadge } from "@/components/events/UnpublishedBadge";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  // Format date for date box with explicit timezone
  const startDate = new Date(event.dateStart);
  const day = startDate.getDate();
  const month = startDate.toLocaleString("de-DE", { 
    month: "short",
    timeZone: "Europe/Berlin"
  }).toUpperCase();
  const monthShort = month.endsWith(".") ? month : month + ".";

  // Format time with explicit timezone
  const timeString = startDate.toLocaleString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin"
  });
  
  // End time if available
  const endTimeString = event.dateEnd
    ? new Date(event.dateEnd).toLocaleString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Berlin"
      })
    : null;

  // Format date with explicit timezone
  const dateString = startDate.toLocaleDateString("de-DE", {
    timeZone: "Europe/Berlin"
  });
  const endDateString = event.dateEnd
    ? new Date(event.dateEnd).toLocaleDateString("de-DE", {
        timeZone: "Europe/Berlin"
      })
    : null;

  return (
    <div className="card-hover group flex flex-col overflow-hidden glass-card bg-card">
      {/* Image header with date box and title */}
      <Link
        href={`/events/${event.slug}`}
        className="block"
      >
        <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-card/60">
        <Image
          src={event.banner || '/bg-vr.png'}
          alt={event.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Datum-Box oben links */}
        <div className="absolute left-4 top-4 z-10 date-badge">
          <span className="text-3xl font-bold leading-none text-white">
            {day}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide glass-text">
            {monthShort}
          </span>
        </div>

        {/* Event-Titel unten im Bild */}
        <div className="absolute inset-x-0 bottom-0 p-6 pt-20">
          {/* Backdrop blur layer with gradient mask */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 via-black/20 to-transparent" style={{ maskImage: 'linear-gradient(to top, black 30%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}></div>
          {/* Color gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 via-black/20 to-transparent"></div>
          {/* Content */}
          <h3 className="relative text-xl font-bold text-white group-hover:text-primary">
            {event.name}
          </h3>
        </div>
        </div>
      </Link>

      {/* Content-Bereich */}
      <div className="flex flex-col flex-1 gap-3 p-5 glass-body">
        {event.published === false && (
          <UnpublishedBadge className="w-fit px-2 py-0.5 text-[11px]" />
        )}

        {/* Date and time */}
        <div className="flex items-center gap-2 text-sm glass-text">
          <Clock className="h-4 w-4" />
          <span>
            {dateString}  {timeString}
            {endDateString && endDateString !== dateString && ` - ${endDateString}`}
            {endTimeString && ` ${endTimeString}`}
          </span>
        </div>

        {/* Distanz - falls vorhanden */}
        {event.distance !== undefined && (
          <div className="flex items-center gap-2 text-sm font-medium text-blue-300 dark:text-blue-300">
            <MapPin className="h-4 w-4" />
            <span>
              {event.distance < 1 
                ? `${Math.round(event.distance * 1000)} m entfernt`
                : `${event.distance.toFixed(1)} km entfernt`
              }
            </span>
          </div>
        )}

        {/* Ort - falls vorhanden */}
        {event.eventAddress && (
          <div className="flex items-start gap-2 text-sm glass-text-muted">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-0.5 h-4 w-4" />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.eventAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 glass-link"
            >
              <span className="line-clamp-2">{event.eventAddress}</span>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Category Badge */}
        {event.category && (
          <div className="mt-2">
            <span className="badge-pill">
              {event.category.name}
            </span>
          </div>
        )}

        <div className="mt-auto pt-2">
          <Button asChild className="w-full">
            <Link href={`/events/${event.slug}`}>
              Mehr erfahren
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
