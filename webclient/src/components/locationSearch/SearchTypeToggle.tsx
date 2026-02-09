"use client";

import { Navigation, MapPin } from "lucide-react";

type SearchType = "gps" | "postal";

interface SearchTypeToggleProps {
  searchType: SearchType;
  onChange: (type: SearchType) => void;
}

export function SearchTypeToggle({ searchType, onChange }: SearchTypeToggleProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => onChange("gps")}
        className={`toggle-pill ${
          searchType === "gps" ? "toggle-pill-active" : "toggle-pill-inactive"
        }`}
        aria-label="Suche per GPS-Standort"
      >
        <Navigation className="w-4 h-4 inline-block mr-2" />
        GPS
      </button>
      <button
        onClick={() => onChange("postal")}
        className={`toggle-pill ${
          searchType === "postal" ? "toggle-pill-active" : "toggle-pill-inactive"
        }`}
        aria-label="Suche per Postleitzahl"
      >
        <MapPin className="w-4 h-4 inline-block mr-2" />
        PLZ
      </button>
    </div>
  );
}
