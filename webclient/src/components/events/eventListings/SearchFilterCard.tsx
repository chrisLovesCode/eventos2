"use client";

import { useState } from "react";
import { MapPin, Filter } from "lucide-react";
import LocationSearch, { LocationSearchParams } from "../../locationSearch/LocationSearch";
import { CategoryFilter } from "./CategoryFilter";
import type { Category } from "@/types/event";

interface SearchFilterCardProps {
  categories: Category[];
  selectedCategorySlugs: string[];
  onLocationChange: (params: LocationSearchParams) => void;
  onLocationClear: () => void;
}

export function SearchFilterCard({
  categories,
  selectedCategorySlugs,
  onLocationChange,
  onLocationClear,
}: SearchFilterCardProps) {
  const [activeTab, setActiveTab] = useState<"location" | "categories">("location");

  return (
    <div className="glass-card bg-brand overflow-hidden">
      {/* Tabs Header */}
      <div className="flex relative tab-header">
        <button
          onClick={() => setActiveTab("location")}
          className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold transition-all duration-300 ${
            activeTab === "location" ? "tab-active" : "tab-inactive"
          }`}
        >
          <MapPin className={`h-5 w-5 transition-all duration-300 ${activeTab === "location" ? "scale-110" : ""}`} />
          <span>Standort</span>
          {activeTab === "location" && (
            <div className="absolute inset-0 bg-gradient-to-br from-brand/40 to-brand/20 rounded-t-xl -z-10" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold transition-all duration-300 ${
            activeTab === "categories" ? "tab-active" : "tab-inactive"
          }`}
        >
          <Filter className={`h-5 w-5 transition-all duration-300 ${activeTab === "categories" ? "scale-110" : ""}`} />
          <span>Kategorien</span>
          {activeTab === "categories" && (
            <div className="absolute inset-0 bg-gradient-to-br from-brand/40 to-brand/20 rounded-t-xl -z-10" />
          )}
        </button>
        {/* Active Indicator */}
        <div
          className="absolute bottom-0 h-1 bg-gradient-to-r from-brand via-primary to-brand transition-all duration-300 ease-out"
          style={{
            width: "50%",
            left: activeTab === "location" ? "0%" : "50%",
          }}
        />
      </div>

      {/* Tab Content */}
      <div className="p-3 sm:p-6">
        {activeTab === "location" && (
          <div className="animate-fade-in">
            <LocationSearch
              onLocationChange={onLocationChange}
              onClear={onLocationClear}
            />
          </div>
        )}

        {activeTab === "categories" && (
          <div className="animate-fade-in">
            {categories.length > 0 ? (
              <CategoryFilter
                categories={categories}
                selectedCategorySlugs={selectedCategorySlugs}
                variant="chips"
              />
            ) : (
              <p className="text-sm glass-text-subtle">Keine Kategorien verfügbar</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
