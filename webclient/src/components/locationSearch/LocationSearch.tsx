"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, X } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchTypeToggle } from "./SearchTypeToggle";
import { GPSSearch } from "./GPSSearch";
import { PostalCodeSearch } from "./PostalCodeSearch";
import { RadiusSlider } from "./RadiusSlider";

interface LocationSearchProps {
  onLocationChange: (params: LocationSearchParams) => void;
  onClear: () => void;
}

export interface LocationSearchParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  postalCode?: string;
}

export default function LocationSearch({ onLocationChange, onClear }: LocationSearchProps) {
  const [mounted, setMounted] = useState(false);
  const [searchType, setSearchType] = useState<"gps" | "postal">("gps");
  const [radius, setRadius] = useState(50);
  const [isActive, setIsActive] = useState(false);
  const [lastPostalCode, setLastPostalCode] = useState<string | null>(null);

  const { 
    latitude, 
    longitude, 
    error, 
    isLocating, 
    requestLocation, 
    clearLocation 
  } = useGeolocation();

  const debouncedLocationUpdate = useDebounce((params: LocationSearchParams) => {
    onLocationChange(params);
  }, 500);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when switching between GPS and postal search
  useEffect(() => {
    setIsActive(false);
    setLastPostalCode(null);
    clearLocation();
    onClear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType]);

  // Trigger search when GPS location is obtained
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setIsActive(true);
      onLocationChange({
        latitude,
        longitude,
        radius,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, radius]);

  const handlePostalCodeSearch = (postalCode: string) => {
    setIsActive(true);
    setLastPostalCode(postalCode);
    onLocationChange({
      postalCode,
      radius,
    });
  };

  const handleRadiusChange = useCallback((newRadius: number) => {
    setRadius(newRadius);
    
    if (!isActive) return;

    if (searchType === "gps" && latitude !== null && longitude !== null) {
      debouncedLocationUpdate({ latitude, longitude, radius: newRadius });
      return;
    }

    if (searchType === "postal" && lastPostalCode) {
      debouncedLocationUpdate({ postalCode: lastPostalCode, radius: newRadius });
    }
  }, [isActive, searchType, latitude, longitude, lastPostalCode, debouncedLocationUpdate]);

  const handleClear = () => {
    setIsActive(false);
    clearLocation();
    onClear();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="wurst">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Standortsuche
        </h3>
        {isActive && (
          <button
            onClick={handleClear}
            className="text-white hover:text-white/80 flex items-center transition-colors"
            aria-label="Standortsuche zurücksetzen"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Type Toggle */}
      <SearchTypeToggle searchType={searchType} onChange={setSearchType} />

      {/* GPS or Postal Code Search */}
      {searchType === "gps" ? (
        <GPSSearch
          onRequest={requestLocation}
          isLocating={isLocating}
          error={error}
          hasLocation={latitude !== null && longitude !== null}
        />
      ) : (
        <PostalCodeSearch onSearch={handlePostalCodeSearch} />
      )}

      {/* Radius Slider (shown when search is active) */}
      {isActive && (
        <div className="mt-6 pt-6 glass-divider">
          <RadiusSlider value={radius} onChange={handleRadiusChange} />
        </div>
      )}
    </div>
  );
}
