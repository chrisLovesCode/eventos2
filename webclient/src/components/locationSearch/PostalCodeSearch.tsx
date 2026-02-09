"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface PostalCodeSearchProps {
  onSearch: (postalCode: string) => void;
}

export function PostalCodeSearch({ onSearch }: PostalCodeSearchProps) {
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const debouncedSearch = useDebounce((code: string) => {
    if (!code.trim()) {
      return;
    }

    if (!/^\d{5}$/.test(code.trim())) {
      setError("Bitte gib eine gültige 5-stellige deutsche PLZ ein.");
      return;
    }

    setError(null);
    onSearch(code.trim());
  }, 500);

  // Trigger search on input change
  useEffect(() => {
    if (postalCode.length === 5) {
      debouncedSearch(postalCode);
    } else if (postalCode.length > 0) {
      setError(null);
    }
  }, [postalCode, debouncedSearch]);

  const handleSearch = () => {
    setError(null);

    if (!postalCode.trim()) {
      setError("Bitte gib eine Postleitzahl ein.");
      return;
    }

    if (!/^\d{5}$/.test(postalCode.trim())) {
      setError("Bitte gib eine gültige 5-stellige deutsche PLZ ein.");
      return;
    }

    onSearch(postalCode.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="postal-code" className="block text-sm glass-label mb-2">
          Postleitzahl
        </label>
        <div className="flex gap-2">
          <input
            id="postal-code"
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            value={postalCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
              setPostalCode(value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder="z.B. 34131"
            maxLength={5}
            className="flex-1 glass-input"
            aria-label="Postleitzahl eingeben"
          />
          <button
            onClick={handleSearch}
            className="glass-button text-sm sm:text-base px-3 sm:px-4"
            aria-label="Nach PLZ suchen"
          >
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <p className="mt-2 text-xs glass-text-subtle">
          Suche startet automatisch bei vollständiger PLZ
        </p>
      </div>

      {error && (
        <div className="status-error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
