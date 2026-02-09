"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faImage, faXmark } from "@fortawesome/free-solid-svg-icons";

interface BannerUploadProps {
  currentBanner?: string | null;
  onBannerChange: (bannerPath: string | null) => void;
  disabled?: boolean;
}

export function BannerUpload({
  currentBanner,
  onBannerChange,
  disabled = false,
}: BannerUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentBanner || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    const file = files?.item(0) ?? null;
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const files = e.target.files;
    const file = files?.item(0) ?? null;
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validierung: Dateityp
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Nur JPG, PNG und WebP Dateien sind erlaubt");
      return;
    }

    // Validierung: Dateigröße (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Datei ist zu groß. Maximum: 5MB");
      return;
    }

    // Preview erstellen
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files/event-banner", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Fehler beim Hochladen des Banners"
        );
      }

      const data = await response.json();
      onBannerChange(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
      setPreviewUrl(currentBanner || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (disabled) return;
    setPreviewUrl(null);
    onBannerChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Event-Banner (800x400px)
      </label>

      {previewUrl ? (
        <div className="relative surface-frame">
          <img
            src={previewUrl}
            alt="Event Banner"
            className="h-48 w-full object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-danger text-danger-foreground shadow-md transition-transform hover:scale-110"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`dropzone ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-surface hover:border-primary/50 hover:bg-muted"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <FontAwesomeIcon
            icon={isDragging ? faCloudArrowUp : faImage}
            className={`mb-4 h-12 w-12 ${
              isDragging ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <p className="mb-2 text-sm font-medium text-foreground">
            {isDragging
              ? "Jetzt loslassen..."
              : "Banner hochladen (Drag & Drop)"}
          </p>
          <p className="text-xs text-muted-foreground">
            oder{" "}
            <span className="font-medium text-primary">hier klicken</span> zum
            Durchsuchen
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, PNG oder WebP (max. 5MB)
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Banner wird hochgeladen...</span>
        </div>
      )}

      {error && (
          <div className="status-error">
            {error}
        </div>
      )}
    </div>
  );
}
