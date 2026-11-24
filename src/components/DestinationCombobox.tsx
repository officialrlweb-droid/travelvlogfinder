"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";
import { DEFAULT_REGION, REGIONS } from "@/lib/constants/taxonomy";

interface DestinationComboboxProps {
  region: string;
  places: string[];
  onChange: (next: { region: string; places: string[] }) => void;
}

const MAX_STOPS = 3;

export function DestinationCombobox({
  region,
  places,
  onChange,
}: DestinationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredRegions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REGIONS.map((reg) => {
      if (!q) {
        return { ...reg, regionMatches: true };
      }
      const regionMatches = reg.name.toLowerCase().includes(q);
      const matched = reg.places.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.highlights.toLowerCase().includes(q)
      );
      return {
        ...reg,
        regionMatches,
        places: regionMatches && matched.length === 0 ? reg.places : matched,
      };
    }).filter((reg) => reg.regionMatches || reg.places.length > 0);
  }, [query]);

  const displayLabel =
    places.length === 0
      ? `${region || DEFAULT_REGION} (All places)`
      : places.length === 1
        ? `${places[0]}, ${region || DEFAULT_REGION}`
        : `${places.join(" + ")}`;

  const handleSelectRegion = (selectedRegion: string) => {
    onChange({ region: selectedRegion, places: [] });
    setQuery("");
    setOpen(false);
  };

  const handleTogglePlace = (selectedRegion: string, selectedPlace: string) => {
    const exists = places.includes(selectedPlace);
    let nextPlaces: string[];
    if (exists) {
      nextPlaces = places.filter((p) => p !== selectedPlace);
    } else if (places.length >= MAX_STOPS) {
      nextPlaces = [...places.slice(1), selectedPlace];
    } else {
      nextPlaces = [...places, selectedPlace];
    }
    onChange({ region: selectedRegion, places: nextPlaces });
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor="destination-trigger"
          className="block text-xs font-semibold uppercase tracking-wide text-stone-600"
        >
          Destination
        </label>
        <span className="text-[11px] font-medium text-stone-400">
          {places.length > 1
            ? `${places.length}-stop route`
            : "1–3 Kerala stops"}
        </span>
      </div>

      <div className="relative">
        <button
          id="destination-trigger"
          type="button"
          onClick={() => {
            setOpen((prev) => !prev);
            setTimeout(() => inputRef.current?.focus(), 20);
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-left text-base font-medium text-stone-900 shadow-xs transition hover:border-emerald-600 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <MapPin className="h-5 w-5 shrink-0 text-emerald-700" />
            <span className="truncate">{displayLabel}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {places.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selected places"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ region: region || DEFAULT_REGION, places: [] });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange({ region: region || DEFAULT_REGION, places: [] });
                  }
                }}
                className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronDown
              className={`h-5 w-5 text-stone-500 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Selected Multi-Stop Pills */}
      {places.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {places.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200"
            >
              {p}
              <button
                type="button"
                aria-label={`Remove ${p}`}
                onClick={() =>
                  onChange({
                    region: region || DEFAULT_REGION,
                    places: places.filter((x) => x !== p),
                  })
                }
                className="rounded p-0.5 text-emerald-700 hover:bg-emerald-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div
          role="listbox"
          aria-label="Select region or up to 3 places"
          aria-multiselectable="true"
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl"
        >
          <div className="border-b border-stone-100 p-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type Wayanad, Munnar, Varkala, Kochi..."
                className="min-h-11 w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 pl-9 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-stone-500">
              <span>Select 1 place, or up to {MAX_STOPS} for a multi-stop route</span>
              {places.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="font-semibold text-emerald-800 hover:underline"
                >
                  Done
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5">
            {filteredRegions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-stone-500">
                No Kerala places matched &ldquo;{query}&rdquo;.
              </div>
            ) : (
              filteredRegions.map((reg) => (
                <div key={reg.name} className="mb-1 last:mb-0">
                  <button
                    type="button"
                    onClick={() => handleSelectRegion(reg.name)}
                    className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                      region === reg.name && places.length === 0
                        ? "bg-emerald-50 text-emerald-900"
                        : "text-stone-800 hover:bg-stone-100"
                    }`}
                  >
                    <span>{reg.name}</span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                      All places
                    </span>
                  </button>

                  <div className="mt-1 space-y-0.5 pl-2">
                    {reg.places.map((p) => {
                      const selected =
                        region === reg.name && places.includes(p.name);
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleTogglePlace(reg.name, p.name)}
                          className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition ${
                            selected
                              ? "bg-emerald-700 text-white"
                              : "text-stone-900 hover:bg-emerald-50/70"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold">
                                {p.name}
                              </span>
                              <span
                                className={`text-xs ${
                                  selected
                                    ? "text-emerald-100"
                                    : "text-stone-500"
                                }`}
                              >
                                {p.district}
                                {p.featured ? " · Popular" : ""}
                              </span>
                            </div>
                            <span
                              className={`mt-0.5 line-clamp-1 text-xs ${
                                selected
                                  ? "text-emerald-100/90"
                                  : "text-stone-500"
                              }`}
                            >
                              {p.highlights}
                            </span>
                          </div>
                          {selected && (
                            <Check className="h-4 w-4 shrink-0 text-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
