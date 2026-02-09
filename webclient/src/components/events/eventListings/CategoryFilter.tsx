"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faFilter, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import type { Category } from "@/types/event";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategorySlugs: string[];
  variant?: "chips" | "sidebar";
}

export function CategoryFilter({
  categories,
  selectedCategorySlugs,
}: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedSet = useMemo(
    () => new Set(selectedCategorySlugs),
    [selectedCategorySlugs]
  );

  const toggleCategory = (categorySlug: string) => {
    const nextSelected = new Set(selectedSet);
    if (nextSelected.has(categorySlug)) {
      nextSelected.delete(categorySlug);
    } else {
      nextSelected.add(categorySlug);
    }

    const params = new URLSearchParams(searchParams.toString());
    const slugs = Array.from(nextSelected);

    if (slugs.length > 0) {
      params.set("categorySlugs", slugs.join(","));
    } else {
      params.delete("categorySlugs");
    }

    params.set("page", "1");

    startTransition(() => {
      router.push(`/?${params.toString()}`, { scroll: false });
    });
  };

  if (categories.length === 0) {
    return null;
  }


  return (
    <div className="">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Kategorien filtern
        </h3>
        {isPending && (
          <span className="text-xs glass-text-subtle">
            Aktualisiere...
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const isChecked = selectedSet.has(category.slug);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.slug)}
              aria-pressed={isChecked}
              aria-label={`Kategorie ${category.name} ${isChecked ? "abwählen" : "auswählen"}`}
              className={`chip-pill ${
                isChecked ? "chip-pill-active" : "chip-pill-inactive"
              }`}
            >
              <FontAwesomeIcon
                icon={isChecked ? faCircleCheck : faCircle}
                className="h-4 w-4 text-primary"
              />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
