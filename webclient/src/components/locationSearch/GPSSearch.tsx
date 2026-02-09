"use client";

import { Navigation } from "lucide-react";

interface GPSSearchProps {
  onRequest: () => void;
  isLocating: boolean;
  error: string | null;
  hasLocation: boolean;
}

export function GPSSearch({ onRequest, isLocating, error, hasLocation }: GPSSearchProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onRequest}
        disabled={isLocating}
        className={`w-full glass-button text-sm sm:text-base ${
          isLocating ? "glass-button-disabled" : ""
        }`}
        aria-label="Aktuellen Standort anfordern"
      >
        <Navigation className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" />
        {isLocating ? "Wird ermittelt..." : "Meinen Standort verwenden"}
      </button>

      {error && (
        <div className="status-error">
          <p>{error}</p>
        </div>
      )}

      {hasLocation && !error && (
        <div className="status-success">
          <p className="flex items-center gap-2">
            <span>✓</span>
            Standort erfolgreich ermittelt!
          </p>
        </div>
      )}
    </div>
  );
}
