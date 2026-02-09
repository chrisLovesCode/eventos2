"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/commons";

interface EventSearchFormProps {
  searchQuery?: string;
}

export function EventSearchForm({ searchQuery = "" }: EventSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = value.trim();

    const params = new URLSearchParams(searchParams.toString());

    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }

    params.set("page", "1");

    router.push(`/?${params.toString()}`);
  };

  const handleClear = () => {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("page", "1");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    inputRef.current?.focus();
  };

  return (
    <div className="mt-8 animate-fade-in-up animate-delay-200 glass-card-heavy p-6">
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1.4fr_auto_auto]">
        <div className="glass-field">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-5 w-5 glass-text-muted" />
          <input
            type="text"
            name="search"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Event suchen..."
            className="w-full bg-transparent text-sm text-white placeholder-white/50 focus:outline-none"
          />
        </div>
        <Button type="submit" className="h-full hover-lift">Suchen</Button>
        <Button
          type="button"
          variant="outline"
          className="h-full hover-lift"
          onClick={handleClear}
          disabled={!value.trim()}
          aria-label="Suche zuruecksetzen"
          title="Suche zuruecksetzen"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
