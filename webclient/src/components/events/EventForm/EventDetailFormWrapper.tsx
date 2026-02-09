"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrash, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { Globe, Link as LinkIcon } from "lucide-react";
import { EventForm } from "./EventForm";
import { Button, Modal } from "@/components/commons";
import { UnpublishedBadge } from "@/components/events/UnpublishedBadge";
import type { Event } from "@/types/event";
import { getCurrentUser } from "@/utils/auth";

interface EventDetailFormWrapperProps {
  event: Event;
}

export function EventDetailFormWrapper({ event }: EventDetailFormWrapperProps) {
  const router = useRouter();
  const [currentEvent, setCurrentEvent] = useState(event);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  // Check ownership on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setIsOwner(
            user.id === currentEvent.userId || user.id === currentEvent.user?.id
          );
          setIsAdmin(user.role === "ADMIN");
          setIsModerator(user.role === "MODERATOR");
        } else {
          setIsOwner(false);
          setIsAdmin(false);
          setIsModerator(false);
        }
      } finally {
        setIsAuthResolved(true);
      }
    };
    loadUser();
  }, [currentEvent.userId, currentEvent.user?.id]);

  const canManage = isAuthResolved && (isAdmin || isModerator || isOwner);

  const handleDelete = async () => {
    if (!canManage) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/events/${currentEvent.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          (errorData?.message &&
            (Array.isArray(errorData.message)
              ? errorData.message.join(", ")
              : errorData.message)) ||
          "Fehler beim Löschen des Events";
        throw new Error(message);
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Fehler beim Löschen des Events"
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEventUpdate = (updatedEvent: Event) => {
    setCurrentEvent(updatedEvent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <>
      {/* Edit Mode: Show EventForm */}
      {isEditing ? (
        <EventForm
          mode="edit"
          event={currentEvent}
          onUpdate={handleEventUpdate}
          onCancel={handleCancel}
        />
      ) : (
        <>
          {/* Read-Only Mode: Display Event Details */}
          <div className="space-y-6">
            {(isAdmin || isModerator) && !currentEvent.published && (
              <UnpublishedBadge />
            )}

            {/* Date and time */}
            <div className="">
              <h3 className="font-semibold text-foreground">Datum & Uhrzeit</h3>
              <div className="text-sprose prose-sm max-w-none text-foreground">
                <span>
                  {new Date(currentEvent.dateStart).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  {new Date(currentEvent.dateStart).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} Uhr
                </span>
                {currentEvent.dateEnd && (
                  <span>
                    {" bis "}
                    {new Date(currentEvent.dateEnd).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    {new Date(currentEvent.dateEnd).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} Uhr
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-foreground">Beschreibung</h3>
              <div className="prose prose-sm max-w-none text-foreground">
                {currentEvent.description ? (
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {currentEvent.description}
                  </p>
                ) : (
                  <p className="italic text-muted-foreground">
                    Keine Beschreibung vorhanden
                  </p>
                )}
              </div>
            </div>

            {/* Event details section */}
            {(currentEvent.eventWebsite || currentEvent.eventAddress || currentEvent.registrationLink || currentEvent.orgaName || (currentEvent.tags && currentEvent.tags.length > 0)) && (
              <div className="mt-6 space-y-4">
                
                {currentEvent.isOnlineEvent && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Globe className="h-4 w-4" />
                    <span>Online-Event</span>
                  </div>
                )}

                {currentEvent.eventAddress && !currentEvent.isOnlineEvent && (
                  <div>
                    <h2 className="font-semibold text-foreground">Veranstaltungsort:</h2>
                    <p className="prose prose-sm max-w-none text-foreground">{currentEvent.eventAddress}</p>
                  </div>
                )}

                {currentEvent.orgaName && (
                  <div>
                    <h2 className="font-semibold text-foreground">Organisiert von:</h2>
                    <p className="prose prose-sm max-w-none text-foreground">
                      {currentEvent.orgaWebsite ? (
                        <a href={currentEvent.orgaWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                          {currentEvent.orgaName}
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3" />
                        </a>
                      ) : (
                        currentEvent.orgaName
                      )}
                    </p>
                  </div>
                )}

                {currentEvent.eventWebsite && (
                  <div>
                    <a
                      href={currentEvent.eventWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>Event Website besuchen</span>
                    </a>
                  </div>
                )}

                {currentEvent.registrationLink && (
                  <div className="mt-8">
                    <a
                      href={currentEvent.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button whitespace-nowrap"
                    >
                      <span>Jetzt anmelden</span>
                    </a>
                  </div>
                )}

                {currentEvent.tags && currentEvent.tags.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-sm mb-4 font-semibold text-foreground">Tags:</h2>
                    <div className="flex flex-wrap gap-2">
                      {currentEvent.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="tag-pill text-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* More Details Link - entfernt, da jetzt oben integriert */}
          </div>

          {/* Edit Button (outside form, only in read-only mode) */}
          {deleteError && (
            <div className="mt-6 status-error">
              {deleteError}
            </div>
          )}

          {canManage && (
            <div className="mt-8 flex gap-3 border-t border-border pt-6">
              <Button type="button" onClick={() => setIsEditing(true)}>
                <FontAwesomeIcon icon={faPencil} className="h-4 w-4" />
                Event bearbeiten
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                {isDeleting ? "Löschen..." : "Event löschen"}
              </Button>
            </div>
          )}
        </>
      )}
      <Modal
        open={showDeleteConfirm}
        title="Event löschen"
        description="Möchtest du dieses Event wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Löschen"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
}
