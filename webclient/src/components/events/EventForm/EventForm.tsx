"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/commons";
import { TextInput, TextArea, SelectInput, DateTimeInput } from "@/components/forms";
import { BannerUpload } from "./BannerUpload";
import type { Category, Event } from "@/types/event";
import { generateSlug } from "@/utils/slug";
import { getCurrentUser } from "@/utils/auth";

interface EventFormProps {
  mode: "create" | "edit";
  event?: Event;
  onUpdate?: (updatedEvent: Event) => void;
  onCancel?: () => void;
}

export function EventForm({ mode, event, onUpdate, onCancel }: EventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [canEditSlug, setCanEditSlug] = useState(false);
  const [canManagePublish, setCanManagePublish] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);
  const createMinDateIso = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString();
  }, []);

  const [formData, setFormData] = useState({
    name: event?.name || "",
    slug: event?.slug || "",
    dateStart: event?.dateStart || "",
    dateEnd: event?.dateEnd || "",
    description: event?.description || "",
    categoryId: event?.categoryId || "",
    banner: event?.banner || null,
    orgaName: event?.orgaName || "",
    orgaWebsite: event?.orgaWebsite || "",
    eventWebsite: event?.eventWebsite || "",
    eventAddress: event?.eventAddress || "",
    registrationLink: event?.registrationLink || "",
    isOnlineEvent: event?.isOnlineEvent || false,
    tags: event?.tags?.join(", ") || "",
    published: event?.published ?? false,
  });

  // Client-side mounting guard
  useEffect(() => {
    setIsMounted(true);
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        const canManage = user.role === "ADMIN" || user.role === "MODERATOR";
        setCanEditSlug(canManage);
        setCanManagePublish(canManage);
      }
    };
    loadUser();
  }, []);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    fetchCategories();
  }, []);

  const handleNameChange = (value: string) => {
    const shouldAutoSlug = mode === "create" || canEditSlug;
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: shouldAutoSlug
        ? canEditSlug && isSlugManual
          ? prev.slug
          : generateSlug(value)
        : prev.slug,
    }));
  };

  const handleSlugChange = (value: string) => {
    setIsSlugManual(true);
    setFormData((prev) => ({ ...prev, slug: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Helper function to ensure URL has protocol
      const ensureHttps = (url: string | null | undefined): string | null => {
        if (!url || !url.trim()) return null;
        const trimmed = url.trim();
        if (!/^https?:\/\//i.test(trimmed)) {
          return `https://${trimmed}`;
        }
        return trimmed;
      };

      const payload: any = {
        name: formData.name.trim(),
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd || null,
        description: formData.description?.trim() || null,
        banner: formData.banner || null,
        categoryId: formData.categoryId || null,
        orgaName: formData.orgaName?.trim() || null,
        orgaWebsite: ensureHttps(formData.orgaWebsite),
        eventWebsite: ensureHttps(formData.eventWebsite),
        eventAddress: formData.eventAddress?.trim() || null,
        registrationLink: ensureHttps(formData.registrationLink),
        isOnlineEvent: formData.isOnlineEvent,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      };
      if (mode === "create" || canEditSlug) {
        payload.slug = formData.slug.trim();
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      let response: Response;
      let resultEvent: Event;

      if (mode === "create") {
        response = await fetch("/api/events", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          credentials: "include",
        });
      } else {
        response = await fetch(`/api/events/${event!.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
          credentials: "include",
        });
      }

      if (!response.ok) {
        let errorMessage = "Ein Fehler ist aufgetreten";
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData?.message)) {
            errorMessage = errorData.message.join(", ");
          } else if (typeof errorData?.message === "string") {
            errorMessage = errorData.message;
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      resultEvent = await response.json();

      if (
        mode === "edit" &&
        canManagePublish &&
        event &&
        event.published !== formData.published
      ) {
        const publishResponse = await fetch(`/api/events/${event.id}/publish`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ published: formData.published }),
          credentials: "include",
        });

        if (!publishResponse.ok) {
          let errorMessage = "Veröffentlichungsstatus konnte nicht aktualisiert werden";
          try {
            const errorData = await publishResponse.json();
            if (Array.isArray(errorData?.message)) {
              errorMessage = errorData.message.join(", ");
            } else if (typeof errorData?.message === "string") {
              errorMessage = errorData.message;
            }
          } catch {
            // ignore JSON parse errors
          }
          throw new Error(errorMessage);
        }

        const publishResult = await publishResponse.json();
        if (publishResult) {
          resultEvent = publishResult as Event;
        } else {
          resultEvent = { ...resultEvent, published: formData.published };
        }
      }

      if (mode === "create") {
        // Redirect to new event page
        router.push(`/events/${resultEvent.slug}`);
      } else {
        // Update local state
        setFormData({
          name: resultEvent.name,
          slug: resultEvent.slug,
          dateStart: resultEvent.dateStart,
          dateEnd: resultEvent.dateEnd || "",
          description: resultEvent.description || "",
          banner: resultEvent.banner || null,
          categoryId: resultEvent.categoryId || "",
          orgaName: resultEvent.orgaName || "",
          orgaWebsite: resultEvent.orgaWebsite || "",
          eventWebsite: resultEvent.eventWebsite || "",
          eventAddress: resultEvent.eventAddress || "",
          registrationLink: resultEvent.registrationLink || "",
          isOnlineEvent: resultEvent.isOnlineEvent || false,
          tags: resultEvent.tags?.join(", ") || "",
          published: resultEvent.published ?? formData.published,
        });
        setIsSlugManual(false);

        // Notify parent component
        if (onUpdate) {
          onUpdate(resultEvent);
        }

        console.log("Event erfolgreich aktualisiert");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (mode === "edit" && event && onCancel) {
      // Reset form to original values
      setFormData({
        name: event.name,
        slug: event.slug,
        dateStart: event.dateStart,
        dateEnd: event.dateEnd || "",
        banner: event.banner || null,
        description: event.description || "",
        categoryId: event.categoryId || "",
        orgaName: event.orgaName || "",
        orgaWebsite: event.orgaWebsite || "",
        eventWebsite: event.eventWebsite || "",
        eventAddress: event.eventAddress || "",
        registrationLink: event.registrationLink || "",
        isOnlineEvent: event.isOnlineEvent || false,
        tags: event.tags?.join(", ") || "",
        published: event.published ?? false,
      });
      setError(null);
      onCancel();
    } else {
      // Navigate back for create mode
      router.back();
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Name */}
        <TextInput
          id="name"
          name="name"
          label="Event-Name"
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="z.B. Tech Conference 2026"
          required
          minLength={3}
          maxLength={200}
          disabled={isLoading}
        />

        {/* Slug */}
        {canEditSlug ? (
          <TextInput
            id="slug"
            name="slug"
            label="URL-Slug"
            type="text"
            value={formData.slug}
            onChange={handleSlugChange}
            placeholder="z.B. tech-conference-2026"
            required
            hint="Wird automatisch aus dem Namen generiert"
            disabled={isLoading}
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              URL-Slug
            </label>
            <div className="readonly-field">
              {formData.slug || "-"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Wird automatisch aus dem Namen generiert
            </p>
          </div>
        )}

        {/* Date Start */}
        <DateTimeInput
          id="dateStart"
          name="dateStart"
          label="Start-Datum und -Uhrzeit"
          value={formData.dateStart}
          onChange={(value) => setFormData({ ...formData, dateStart: value })}
          required
          min={mode === "create" ? createMinDateIso : undefined}
          disabled={isLoading}
        />

        {/* Date End */}
        <DateTimeInput
          id="dateEnd"
          name="dateEnd"
          label="End-Datum und -Uhrzeit"
          value={formData.dateEnd}
          onChange={(value) => setFormData({ ...formData, dateEnd: value })}
          required
          min={
            mode === "create"
              ? formData.dateStart || createMinDateIso
              : undefined
          }
          disabled={isLoading}
        />

        {/* Description */}
        <TextArea
          id="description"
          name="description"
          label="Beschreibung"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Beschreibung des Events..."
          rows={6}
          minLength={10}
          maxLength={5000}
          hint="Mindestens 10 Zeichen."
          disabled={isLoading}
        />

        {/* Event Banner Upload */}
        <BannerUpload
          currentBanner={formData.banner}
          onBannerChange={(bannerPath) => setFormData({ ...formData, banner: bannerPath })}
          disabled={isLoading}
        />

        {/* Category */}
        <SelectInput
          id="category"
          name="category"
          label="Kategorie"
          value={formData.categoryId}
          onChange={(value) => setFormData({ ...formData, categoryId: value })}
          options={categories.map((cat) => ({
            value: cat.id,
            label: cat.name,
          }))}
          placeholder="-- Kategorie wählen --"
          disabled={isLoading}
        />

        {/* Organisator-Informationen */}
        <div className="space-y-4 card-sidebar">
          <h3 className="text-sm font-semibold text-foreground">Organisator-Informationen</h3>
          
          <TextInput
            id="orgaName"
            name="orgaName"
            label="Organisator Name"
            type="text"
            value={formData.orgaName}
            onChange={(value) => setFormData({ ...formData, orgaName: value })}
            placeholder="z.B. Tech Events GmbH"
            disabled={isLoading}
          />

          <TextInput
            id="orgaWebsite"
            name="orgaWebsite"
            label="Organisator Website"
            type="url"
            value={formData.orgaWebsite}
            onChange={(value) => setFormData({ ...formData, orgaWebsite: value })}
            placeholder="https://..."
            disabled={isLoading}
          />
        </div>

        {mode === "edit" && canManagePublish && (
          <div className="card-sidebar">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Veröffentlichungsstatus
            </h3>
            <SelectInput
              id="publishedStatus"
              name="publishedStatus"
              label="Status"
              value={formData.published ? "published" : "unpublished"}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  published: value === "published",
                })
              }
              options={[
                { value: "unpublished", label: "Unveröffentlicht" },
                { value: "published", label: "Veröffentlicht" },
              ]}
              placeholder="Status wählen"
              disabled={isLoading}
              hint="Nur Admins und Moderatoren können den Veröffentlichungsstatus ändern."
            />
          </div>
        )}

        {/* Event-Details */}
        <div className="space-y-4 card-sidebar">
          <h3 className="text-sm font-semibold text-foreground">Event-Details</h3>
          
          <TextInput
            id="eventWebsite"
            name="eventWebsite"
            label="Event Website"
            type="url"
            value={formData.eventWebsite}
            onChange={(value) => setFormData({ ...formData, eventWebsite: value })}
            placeholder="https://..."
            disabled={isLoading}
          />

          <TextInput
            id="eventAddress"
            name="eventAddress"
            label="Veranstaltungsort"
            type="text"
            value={formData.eventAddress}
            onChange={(value) => setFormData({ ...formData, eventAddress: value })}
            placeholder="z.B. Convention Center, Hauptstraße 1, 10115 Berlin"
            disabled={isLoading}
          />

          <TextInput
            id="registrationLink"
            name="registrationLink"
            label="Registrierungs-Link"
            type="url"
            value={formData.registrationLink}
            onChange={(value) => setFormData({ ...formData, registrationLink: value })}
            placeholder="https://..."
            disabled={isLoading}
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isOnlineEvent"
              checked={formData.isOnlineEvent}
              onChange={(e) => setFormData({ ...formData, isOnlineEvent: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-1 focus:ring-primary/50"
              disabled={isLoading}
            />
            <label htmlFor="isOnlineEvent" className="text-sm font-medium text-foreground">
              Online-Event
            </label>
          </div>

          <TextInput
            id="tags"
            name="tags"
            label="Tags (kommagetrennt)"
            type="text"
            value={formData.tags}
            onChange={(value) => setFormData({ ...formData, tags: value })}
            placeholder="z.B. tech, ai, networking"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="status-error">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 border-t border-border pt-6">
          <Button type="submit" disabled={isLoading} variant="success">
            <FontAwesomeIcon icon={faSave} className="h-4 w-4" />
            {isLoading
              ? "Speichern..."
              : mode === "create"
              ? "Event erstellen"
              : "Änderungen speichern"}
          </Button>
          <Button type="button" onClick={handleCancelClick} disabled={isLoading} variant="secondary">
            <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  );
}
