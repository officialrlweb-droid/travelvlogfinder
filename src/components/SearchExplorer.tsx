"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  Columns3,
  Filter,
  Info,
  Lock,
  PlusCircle,
  RotateCcw,
  Route,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  BUDGET_DISCLAIMER_NOTE,
  DEFAULT_REGION,
  LANGUAGE_OPTIONS,
  PLATFORM_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  type Platform,
} from "@/lib/constants/taxonomy";
import type { SearchFilters, SearchResponse } from "@/lib/search/types";
import {
  useShortlist,
  type SavedCreatorItem,
} from "@/lib/shortlist/useShortlist";
import { BrandMark } from "./BrandLogo";
import { CreatorCard } from "./CreatorCard";
import { DestinationCombobox } from "./DestinationCombobox";
import { PlatformIcon } from "./PlatformIcon";
import { TripBoardDrawer } from "./TripBoardDrawer";

interface SearchExplorerProps {
  initialData: SearchResponse;
  initialFilters?: SearchFilters;
}

const DAY_PRESETS = [1, 2, 3, 4, 5, 6] as const;
const BUDGET_PRESETS = [4000, 5000, 8000, 10000, 15000, 20000] as const;
const TRAVELER_OPTIONS = [
  { value: 1, label: "Solo" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 6, label: "6" },
] as const;

const QUICK_SCENARIOS = [
  { label: "Wayanad · 2d · Rs 5,000", places: ["Wayanad"], days: 2, budget: 5000 },
  {
    label: "Wayanad + Munnar · 4d · Rs 12,000",
    places: ["Wayanad", "Munnar"],
    days: 4,
    budget: 12000,
  },
  { label: "Varkala · 2d · Rs 6,000", places: ["Varkala"], days: 2, budget: 6000 },
  { label: "Kochi · 2d · Rs 4,000", places: ["Kochi"], days: 2, budget: 4000 },
] as const;

function formatInr(amount: number): string {
  return Math.round(amount).toLocaleString("en-IN");
}

export function SearchExplorer({
  initialData,
  initialFilters,
}: SearchExplorerProps) {
  const [region, setRegion] = useState(
    initialFilters?.region || initialData.tripSummary.region || DEFAULT_REGION
  );
  const [places, setPlaces] = useState<string[]>(
    initialFilters?.places ?? initialData.tripSummary.places ?? []
  );
  const initialDaysVal = initialFilters?.days ?? initialData.tripSummary.days;
  const [daysInput, setDaysInput] = useState(
    initialDaysVal ? String(initialDaysVal) : ""
  );
  const [customDaysMode, setCustomDaysMode] = useState(
    Boolean(initialDaysVal && initialDaysVal >= 7)
  );
  const initialBudgetVal =
    initialFilters?.totalBudget ?? initialData.tripSummary.totalBudget;
  const [budgetInput, setBudgetInput] = useState(
    initialBudgetVal ? String(initialBudgetVal) : ""
  );
  const [travelers, setTravelers] = useState<number>(
    initialFilters?.travelers ?? initialData.tripSummary.travelers ?? 1
  );
  const [keyword, setKeyword] = useState(initialFilters?.q ?? "");
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    initialFilters?.styles ?? []
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    initialFilters?.languages ?? []
  );
  const [platform, setPlatform] = useState<Platform | "">(
    initialFilters?.platform ?? ""
  );
  const [showOptionalFilters, setShowOptionalFilters] = useState(
    Boolean(
      (initialFilters?.styles?.length ?? 0) > 0 ||
        (initialFilters?.languages?.length ?? 0) > 0 ||
        initialFilters?.platform
    )
  );
  const [copiedShare, setCopiedShare] = useState(false);

  const [results, setResults] = useState<SearchResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardView, setBoardView] = useState<"shortlist" | "compare" | null>(
    null
  );

  const resultsRef = useRef<HTMLElement>(null);
  const requestSeqRef = useRef(0);
  const skipNextDebounceRef = useRef(false);

  const { items: savedItems, isSaved, toggleSave, saveMany, removeItem, clearAll } =
    useShortlist();

  const parsedDays = Number(daysInput);
  const parsedBudget = Number(budgetInput);
  const livePerDay =
    Number.isFinite(parsedDays) &&
    parsedDays >= 1 &&
    Number.isFinite(parsedBudget) &&
    parsedBudget > 0
      ? Math.round(parsedBudget / parsedDays)
      : null;

  const activeOptionalFilterCount =
    selectedStyles.length + selectedLanguages.length + (platform ? 1 : 0);

  const executeSearch = useCallback(
    async (overrides?: {
      region?: string;
      places?: string[];
      days?: string;
      budget?: string;
      travelers?: number;
      keyword?: string;
      styles?: string[];
      languages?: string[];
      platform?: Platform | "";
    }) => {
      const nextRegion = overrides?.region ?? region;
      const nextPlaces = overrides?.places ?? places;
      const nextDays = overrides?.days ?? daysInput;
      const nextBudget = overrides?.budget ?? budgetInput;
      const nextTravelers = overrides?.travelers ?? travelers;
      const nextKeyword = overrides?.keyword ?? keyword;
      const nextStyles = overrides?.styles ?? selectedStyles;
      const nextLanguages = overrides?.languages ?? selectedLanguages;
      const nextPlatform = overrides?.platform ?? platform;

      const sp = new URLSearchParams();
      if (nextRegion) sp.set("region", nextRegion);
      if (nextPlaces.length === 1) {
        sp.set("place", nextPlaces[0]);
      } else if (nextPlaces.length > 1) {
        sp.set("places", nextPlaces.join(","));
      }
      if (nextDays.trim()) sp.set("days", nextDays.trim());
      if (nextBudget.trim()) sp.set("totalBudget", nextBudget.trim());
      if (nextTravelers > 1) sp.set("travelers", String(nextTravelers));
      if (nextKeyword.trim()) sp.set("q", nextKeyword.trim());
      if (nextPlatform) sp.set("platform", nextPlatform);
      if (nextStyles.length > 0) sp.set("styles", nextStyles.join(","));
      if (nextLanguages.length > 0) sp.set("languages", nextLanguages.join(","));

      // Sync shareable URL cleanly
      if (typeof window !== "undefined") {
        const shareParams = new URLSearchParams();
        if (nextRegion && nextRegion !== DEFAULT_REGION) {
          shareParams.set("region", nextRegion);
        }
        if (nextPlaces.length === 1) {
          shareParams.set("place", nextPlaces[0]);
        } else if (nextPlaces.length > 1) {
          shareParams.set("places", nextPlaces.join(","));
        }
        if (nextDays.trim()) shareParams.set("days", nextDays.trim());
        if (nextBudget.trim()) shareParams.set("budget", nextBudget.trim());
        if (nextTravelers > 1) shareParams.set("travelers", String(nextTravelers));
        if (nextKeyword.trim()) shareParams.set("q", nextKeyword.trim());
        if (nextPlatform) shareParams.set("platform", nextPlatform);
        if (nextStyles.length > 0) shareParams.set("styles", nextStyles.join(","));
        if (nextLanguages.length > 0) {
          shareParams.set("languages", nextLanguages.join(","));
        }
        const qs = shareParams.toString();
        const nextUrl = qs
          ? `${window.location.pathname}?${qs}`
          : window.location.pathname;
        window.history.replaceState(null, "", nextUrl);
      }

      const seq = ++requestSeqRef.current;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?${sp.toString()}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as SearchResponse & { error?: string };
        if (seq !== requestSeqRef.current) {
          return;
        }
        if (!res.ok) {
          setError(data.error || "Unable to run search.");
        } else {
          setResults(data);
        }
      } catch {
        if (seq === requestSeqRef.current) {
          setError("Connection error. Please try searching again.");
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [
      region,
      places,
      daysInput,
      budgetInput,
      travelers,
      keyword,
      selectedStyles,
      selectedLanguages,
      platform,
    ]
  );

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void executeSearch();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, budgetInput, daysInput]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void executeSearch();
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleStyle = (style: string) => {
    const next = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];
    setSelectedStyles(next);
    void executeSearch({ styles: next });
  };

  const toggleLanguage = (lang: string) => {
    const next = selectedLanguages.includes(lang)
      ? selectedLanguages.filter((l) => l !== lang)
      : [...selectedLanguages, lang];
    setSelectedLanguages(next);
    void executeSearch({ languages: next });
  };

  const handlePlatformChange = (nextPlatform: Platform | "") => {
    setPlatform(nextPlatform);
    void executeSearch({ platform: nextPlatform });
  };

  const handleTravelersChange = (nextCount: number) => {
    setTravelers(nextCount);
    void executeSearch({ travelers: nextCount });
  };

  const handleQuickScenario = (scenario: (typeof QUICK_SCENARIOS)[number]) => {
    skipNextDebounceRef.current = true;
    const nextPlaces = [...scenario.places];
    setRegion(DEFAULT_REGION);
    setPlaces(nextPlaces);
    setDaysInput(String(scenario.days));
    setCustomDaysMode(scenario.days >= 7);
    setBudgetInput(String(scenario.budget));
    setKeyword("");
    setSelectedStyles([]);
    setSelectedLanguages([]);
    setPlatform("");
    void executeSearch({
      region: DEFAULT_REGION,
      places: nextPlaces,
      days: String(scenario.days),
      budget: String(scenario.budget),
      keyword: "",
      styles: [],
      languages: [],
      platform: "",
    });
  };

  const handleReset = () => {
    skipNextDebounceRef.current = true;
    setRegion(DEFAULT_REGION);
    setPlaces([]);
    setDaysInput("");
    setCustomDaysMode(false);
    setBudgetInput("");
    setTravelers(1);
    setKeyword("");
    setSelectedStyles([]);
    setSelectedLanguages([]);
    setPlatform("");
    void executeSearch({
      region: DEFAULT_REGION,
      places: [],
      days: "",
      budget: "",
      travelers: 1,
      keyword: "",
      styles: [],
      languages: [],
      platform: "",
    });
  };

  const handleShareTrip = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;
    const destLabel =
      places.length > 0 ? places.join(" + ") : region || DEFAULT_REGION;
    const shareTitle = results.tripSummary.headerText
      ? `TravelVlogFinder — ${destLabel} (${results.tripSummary.headerText})`
      : `TravelVlogFinder — ${destLabel} travel creators`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      window.prompt("Copy this shareable trip link:", shareUrl);
    }
  };

  const handleSaveRouteCombo = () => {
    const combo = results.tripSummary.routeCombo;
    if (!combo) return;
    const byId = new Map(results.creators.map((c) => [c.id, c]));
    const toSave: SavedCreatorItem[] = [];
    for (const id of combo.uniqueCreatorIds) {
      const full = byId.get(id);
      if (full) {
        toSave.push({
          id: full.id,
          name: full.name,
          platform: full.platform,
          profileLink: full.profileLink,
          followersRange: full.followersRange,
          placesCovered: full.placesCovered,
          travelStyle: full.travelStyle,
          language: full.language,
          budgetMinPerDay: full.budgetMinPerDay,
          budgetMaxPerDay: full.budgetMaxPerDay,
          minDays: full.minDays,
          maxDays: full.maxDays,
          verified: full.verified,
          videoCount: full.featuredVideos.length,
        });
      }
    }
    if (toSave.length > 0) {
      saveMany(toSave);
      setBoardView("shortlist");
    }
  };

  const withinCount = results.creators.filter(
    (c) => c.budgetFit === "within"
  ).length;
  const slightlyOverCount = results.creators.filter(
    (c) => c.budgetFit === "slightly_over"
  ).length;

  const activePlaces = results.tripSummary.places ?? [];
  const activeDestLabel =
    activePlaces.length > 0
      ? activePlaces.join(" + ")
      : results.tripSummary.region;
  const spend = results.tripSummary.spendBreakdown;
  const routeCombo = results.tripSummary.routeCombo;

  return (
    <div className="min-h-screen pb-24">
      {/* Top Hero + Navigation */}
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8 sm:pb-24">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-10 w-10 shrink-0 rounded-xl shadow-sm ring-1 ring-white/25" />
              <div>
                <span className="text-lg font-extrabold tracking-tight">
                  TravelVlogFinder
                </span>
                <span className="ml-2 inline-flex items-center rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-100 ring-1 ring-emerald-300/30">
                  Kerala, India
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/submit"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-emerald-400/20 px-3.5 text-xs font-semibold text-white ring-1 ring-emerald-300/35 transition hover:bg-emerald-400/30"
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-200" />
                Submit creator
              </Link>
              <Link
                href="/admin"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-xs font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/25"
              >
                <Lock className="h-3.5 w-3.5 text-emerald-200" />
                Admin
              </Link>
            </div>
          </div>

          <div className="mt-7 max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl sm:leading-tight">
              Find Kerala travel creators who actually travel on{" "}
              <span className="text-emerald-200">your budget &amp; days</span>
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-emerald-100/90 sm:text-base">
              Pick 1 to 3 Kerala stops, trip days, and INR budget for stay,
              food, and local travel. Match creators, compare side-by-side, and
              share to your trip group.
            </p>
          </div>
        </div>
      </header>

      {/* Main Search Panel */}
      <main className="relative z-10 mx-auto -mt-14 max-w-5xl px-4 sm:px-6">
        <section
          aria-label="Trip search form"
          className="rounded-3xl border border-stone-200/90 bg-white p-4 shadow-xl shadow-stone-900/5 sm:p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Primary 3-column search inputs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              {/* Destination (1-3 stops) */}
              <div className="md:col-span-4">
                <DestinationCombobox
                  region={region}
                  places={places}
                  onChange={({ region: nextReg, places: nextPlaces }) => {
                    setRegion(nextReg);
                    setPlaces(nextPlaces);
                    void executeSearch({
                      region: nextReg,
                      places: nextPlaces,
                    });
                  }}
                />
              </div>

              {/* Number of days */}
              <div className="md:col-span-4">
                <label
                  htmlFor="days-input"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600"
                >
                  Number of days
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_PRESETS.map((d) => {
                    const active = !customDaysMode && Number(daysInput) === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          skipNextDebounceRef.current = true;
                          setCustomDaysMode(false);
                          setDaysInput(String(d));
                          void executeSearch({ days: String(d) });
                        }}
                        className={`flex min-h-12 items-center justify-center rounded-xl text-sm font-bold transition ${
                          active
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "border border-stone-300 bg-white text-stone-800 hover:border-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDaysMode(true);
                      if (!daysInput || Number(daysInput) < 7) {
                        skipNextDebounceRef.current = true;
                        setDaysInput("7");
                        void executeSearch({ days: "7" });
                      }
                    }}
                    className={`flex min-h-12 items-center justify-center rounded-xl text-sm font-bold transition ${
                      customDaysMode || Number(daysInput) >= 7
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "border border-stone-300 bg-white text-stone-800 hover:border-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    7+
                  </button>
                </div>

                {(customDaysMode || Number(daysInput) >= 7) && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="days-input"
                      type="number"
                      min={1}
                      max={60}
                      inputMode="numeric"
                      value={daysInput}
                      onChange={(e) => setDaysInput(e.target.value)}
                      placeholder="Custom days"
                      className="min-h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-sm font-semibold text-stone-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
                    />
                    <span className="shrink-0 text-xs font-medium text-stone-500">
                      days
                    </span>
                  </div>
                )}
              </div>

              {/* Total Budget in INR */}
              <div className="md:col-span-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor="total-budget-input"
                    className="block whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-stone-600"
                  >
                    {travelers > 1
                      ? "Budget / person (INR)"
                      : "Total budget (INR)"}
                  </label>
                  {livePerDay !== null && (
                    <span className="whitespace-nowrap text-xs font-bold text-emerald-700">
                      Rs {formatInr(livePerDay)}/day
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-bold text-stone-500">
                    Rs
                  </span>
                  <input
                    id="total-budget-input"
                    type="number"
                    min={500}
                    step={500}
                    inputMode="numeric"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="5000"
                    className="min-h-12 w-full rounded-xl border border-stone-300 bg-white pr-3.5 pl-10 text-base font-bold text-stone-900 shadow-xs transition hover:border-emerald-600 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {BUDGET_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        skipNextDebounceRef.current = true;
                        setBudgetInput(String(amt));
                        void executeSearch({ budget: String(amt) });
                      }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        Number(budgetInput) === amt
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Keyword Full-Text Search Bar + Optional Filters Toggle */}
            <div className="flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Keyword search: creator name, place, cliff cafes, KSRTC, Kolukkumalai, treehouse..."
                  aria-label="Keyword search across creators and videos"
                  className="min-h-12 w-full rounded-xl border border-stone-300 bg-stone-50/70 pr-10 pl-11 text-sm text-stone-900 placeholder:text-stone-400 transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword("")}
                    aria-label="Clear keyword search"
                    className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOptionalFilters((prev) => !prev)}
                  className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition sm:flex-none ${
                    showOptionalFilters || activeOptionalFilterCount > 0
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeOptionalFilterCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1.5 text-xs font-bold text-white">
                      {activeOptionalFilterCount}
                    </span>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:outline-none disabled:opacity-70 sm:flex-none"
                >
                  <Search className="h-4 w-4" />
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {/* Collapsible Optional Filters */}
            {showOptionalFilters && (
              <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-600">
                    Platform
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlatformChange("")}
                      className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition ${
                        platform === ""
                          ? "bg-emerald-700 text-white"
                          : "border border-stone-300 bg-white text-stone-700 hover:border-emerald-600"
                      }`}
                    >
                      All platforms
                    </button>
                    {PLATFORM_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handlePlatformChange(opt.value)}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                          platform === opt.value
                            ? "bg-emerald-700 text-white"
                            : "border border-stone-300 bg-white text-stone-700 hover:border-emerald-600"
                        }`}
                      >
                        <PlatformIcon platform={opt.value} className="h-4 w-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-600">
                    Travel style (multi-select)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TRAVEL_STYLE_OPTIONS.map((style) => {
                      const active = selectedStyles.includes(style);
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleStyle(style)}
                          aria-pressed={active}
                          className={`min-h-10 rounded-full px-3.5 text-xs font-semibold transition sm:text-sm ${
                            active
                              ? "bg-emerald-700 text-white shadow-xs"
                              : "border border-stone-300 bg-white text-stone-700 hover:border-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-600">
                    Language (multi-select)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const active = selectedLanguages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          aria-pressed={active}
                          className={`min-h-10 rounded-full px-3.5 text-xs font-semibold transition sm:text-sm ${
                            active
                              ? "bg-emerald-700 text-white shadow-xs"
                              : "border border-stone-300 bg-white text-stone-700 hover:border-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quick-try presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  Try:
                </span>
                {QUICK_SCENARIOS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleQuickScenario(s)}
                    className="min-h-9 rounded-full border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Show all Kerala creators
              </button>
            </div>
          </form>
        </section>

        {/* Results Section */}
        <section ref={resultsRef} className="mt-7" aria-live="polite">
          {/* Trip Summary Header + Group Split + Spend Breakdown + Disclaimer */}
          <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs sm:p-5">
            {loading && (
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-emerald-100"
              >
                <div className="tvf-indeterminate-bar h-full w-1/2 rounded-full bg-emerald-700" />
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-stone-900 sm:text-xl">
                  {results.tripSummary.headerText
                    ? results.tripSummary.headerText
                    : `Exploring ${activeDestLabel}`}
                </h2>
                <p className="mt-0.5 text-sm text-stone-600">
                  {results.totalCount}{" "}
                  {results.totalCount === 1 ? "creator" : "creators"} matched
                  {activePlaces.length > 0
                    ? ` for ${activePlaces.join(" + ")}`
                    : ` across ${results.tripSummary.region}`}
                  {results.tripSummary.perDayBudget !== null &&
                  results.totalCount > 0 ? (
                    <span className="ml-1.5 text-stone-500">
                      ({withinCount} within budget
                      {slightlyOverCount > 0
                        ? `, ${slightlyOverCount} slightly over`
                        : ""}
                      )
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                {results.tripSummary.perDayBudget !== null && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
                    <Filter className="h-3.5 w-3.5 text-emerald-700" />
                    {activePlaces.length > 1
                      ? "Sorted: Most stops covered, then exact budget"
                      : "Sorted: Exact budget match first, then closest"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleShareTrip}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-900 transition hover:bg-emerald-100"
                >
                  {copiedShare ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                      Link copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5 text-emerald-700" />
                      Share trip
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Group Split + Per-Day Spend Breakdown Bar */}
            {spend && (
              <div className="mt-4 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                    <span className="font-semibold text-stone-900">
                      Typical daily split:
                    </span>
                    <span>
                      Stay{" "}
                      <strong className="text-stone-900">
                        ~Rs {formatInr(spend.stayPerDay)}
                      </strong>
                    </span>
                    <span>
                      Food{" "}
                      <strong className="text-stone-900">
                        ~Rs {formatInr(spend.foodPerDay)}
                      </strong>
                    </span>
                    <span>
                      Local travel{" "}
                      <strong className="text-stone-900">
                        ~Rs {formatInr(spend.localTravelPerDay)}
                      </strong>
                    </span>
                  </div>

                  {/* Clean Group Size Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500">
                      <Users className="h-3.5 w-3.5" />
                      Group:
                    </span>
                    <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5">
                      {TRAVELER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleTravelersChange(opt.value)}
                          className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition ${
                            travelers === opt.value
                              ? "bg-emerald-700 text-white"
                              : "text-stone-600 hover:bg-stone-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Minimal 3-segment bar */}
                <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="bg-emerald-700"
                    style={{ width: "48%" }}
                    title="Stay (~48%)"
                  />
                  <div
                    className="bg-emerald-400"
                    style={{ width: "28%" }}
                    title="Food (~28%)"
                  />
                  <div
                    className="bg-stone-400"
                    style={{ width: "24%" }}
                    title="Local travel (~24%)"
                  />
                </div>

                {spend.travelers > 1 && results.tripSummary.totalBudget && (
                  <p className="mt-2.5 text-xs text-stone-600">
                    <strong className="text-stone-900">
                      {spend.travelers} travelers pool:
                    </strong>{" "}
                    Rs{" "}
                    {formatInr(
                      results.tripSummary.totalBudget * spend.travelers
                    )}{" "}
                    total trip budget · Shared room power{" "}
                    <strong className="text-emerald-800">
                      ~Rs {formatInr(spend.sharedRoomBudgetPerNight)}/night
                    </strong>{" "}
                    · Shared jeep/cab pool{" "}
                    <strong className="text-emerald-800">
                      ~Rs {formatInr(spend.sharedLocalTravelPerDay)}/day
                    </strong>
                  </p>
                )}
              </div>
            )}

            {/* Required Budget Scope Disclaimer */}
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-xs font-medium text-amber-950 sm:text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <span>
                {results.tripSummary.budgetNote || BUDGET_DISCLAIMER_NOTE}
              </span>
            </div>
          </div>

          {/* Multi-Stop Route Watchlist Combo Card (2-3 stops selected) */}
          {routeCombo && routeCombo.uniqueCreatorIds.length > 0 && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Route className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 sm:text-base">
                      {routeCombo.allStopsCoveredBySingleCreator
                        ? `Multi-Stop Route: ${activePlaces.join(" -> ")}`
                        : `Recommended Route Watchlist: ${activePlaces.join(" -> ")}`}
                    </h3>
                    <p className="text-xs text-stone-600">
                      {routeCombo.allStopsCoveredBySingleCreator
                        ? "Creators covering all selected stops appear at the top below."
                        : "No single creator covers every stop — here is the best budget-matched pairing per stop."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveRouteCombo}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white transition hover:bg-emerald-800"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Save route to Trip Board
                </button>
              </div>

              <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {routeCombo.stops.map((stop, idx) => (
                  <div
                    key={stop.place}
                    className="rounded-xl border border-stone-200 bg-stone-50/70 p-3"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                      Stop {idx + 1} · {stop.place}
                    </p>
                    {stop.creator ? (
                      <div className="mt-1">
                        <Link
                          href={`/creators/${stop.creator.id}`}
                          className="line-clamp-1 text-sm font-bold text-stone-900 hover:text-emerald-800 hover:underline"
                        >
                          {stop.creator.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-stone-600">
                          Rs {formatInr(stop.creator.budgetMinPerDay)} –{" "}
                          {formatInr(stop.creator.budgetMaxPerDay)}/day
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-stone-500">
                        No matching creator for this stop &amp; budget yet.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
              {error}
            </div>
          )}

          {/* Creator Result Cards */}
          {results.creators.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
              <p className="text-base font-bold text-stone-900">
                No creators matched every criteria
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-stone-600">
                Try increasing your daily budget, adjusting the number of days,
                clearing an optional filter, or searching across all of Kerala.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  View all Kerala creators
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`mt-5 space-y-4 transition-opacity duration-200 ${
                loading ? "opacity-60" : "opacity-100"
              }`}
            >
              {results.creators.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  creator={creator}
                  selectedPlaces={activePlaces}
                  selectedDays={results.tripSummary.days}
                  selectedBudget={results.tripSummary.totalBudget}
                  travelers={results.tripSummary.travelers}
                  saved={isSaved(creator.id)}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Subtle Floating Trip Board & Compare Bar (visible when 1+ saved) */}
      {savedItems.length > 0 && (
        <div className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl shadow-stone-900/15 sm:right-6 sm:bottom-6">
          <button
            type="button"
            onClick={() => setBoardView("shortlist")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white transition hover:bg-emerald-800 sm:text-sm"
          >
            <Bookmark className="h-4 w-4 fill-current" />
            Trip Board ({savedItems.length})
          </button>
          {savedItems.length >= 2 && (
            <button
              type="button"
              onClick={() => setBoardView("compare")}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-stone-100 px-3.5 text-xs font-bold text-stone-800 transition hover:bg-stone-200 sm:text-sm"
            >
              <Columns3 className="h-4 w-4 text-emerald-700" />
              Compare
            </button>
          )}
        </div>
      )}

      {boardView && (
        <TripBoardDrawer
          items={savedItems}
          initialView={boardView}
          days={results.tripSummary.days}
          travelers={results.tripSummary.travelers}
          tripLabel={
            results.tripSummary.headerText
              ? `${activeDestLabel} · ${results.tripSummary.headerText.replace(
                  "Your trip: ",
                  ""
                )}`
              : activeDestLabel
          }
          onRemove={removeItem}
          onClearAll={clearAll}
          onClose={() => setBoardView(null)}
        />
      )}
    </div>
  );
}
