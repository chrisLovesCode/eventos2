"use client";

import type { Event } from "@/types/event";
import { EventForm } from "./EventForm";

interface EventDetailFormProps {
  event: Event;
  onUpdate?: (updatedEvent: Event) => void;
}

export function EventDetailForm({ event, onUpdate }: EventDetailFormProps) {
  return <EventForm mode="edit" event={event} onUpdate={onUpdate} />;
}
