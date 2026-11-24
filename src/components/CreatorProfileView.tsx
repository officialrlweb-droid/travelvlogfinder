"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Check,
  Compass,
  ExternalLink,
  Grid3X3,
  Info,
  MapPin,
  Play,
  Share2,
  ShieldCheck,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import {
  ALL_PLACES,
  BUDGET_DISCLAIMER_NOTE,
} from "@/lib/constants/taxonomy";
import {
  parseOfficialEmbed,
  type OfficialOEmbedResponse,
} from "@/lib/embeds/official-embed";
import type { CreatorProfileDetail } from "@/lib/search/profile";
import type { FeaturedVideo } from "@/lib/search/types";
import { useShortlist } from "@/lib/shortlist/useShortlist";
import { ClaimProfileModal } from "./ClaimProfileModal";
import { PlatformIcon } from "./PlatformIcon";

interface CreatorProfileViewProps {
  creator: CreatorProfileDetail;
  initialDays?: number | null;
  initialBudget?: number | null;
}

type ProfileTab = "grid" | "guide" | "similar";

function formatInr(val: number): string {
  return Math.round(val).toLocaleString("en-IN");
}

function getInitials(name: string): string {
  const cleaned = name.replace(/\(.*?\)/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || "TV";
}

function extractHandle(profileLink: string, name: string): string {
  try {
    const url = new URL(profileLink);
    const parts = url.pathname.split("/").filter(Boolean);
    const handle = parts[0];
    if (handle) {
      return handle.startsWith("@") ? handle : `@${handle}`;
    }
  } catch {
    // Fallback below
  }
  return `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
}

export function CreatorProfileView({
  creator,
  initialDays,
  initialBudget,
}: CreatorProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("grid");
  const [selectedPlace, setSelectedPlace] = useState<string>("All");
  const [activeVideo, setActiveVideo] = useState<FeaturedVideo | null>(null);
  const [oembedCache, setOembedCache] = useState<
    Record<string, OfficialOEmbedResponse>
  >({});
  const [loadingModalEmbed, setLoadingModalEmbed] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isSaved, toggleSave } = useShortlist();
  const saved = isSaved(creator.id);

  const [calcDays, setCalcDays] = useState<number>(
    initialDays && initialDays >= 1
      ? initialDays
      : Math.max(creator.minDays, 2)
  );

  const handle = useMemo(
    () => extractHandle(creator.profileLink, creator.name),
    [creator.profileLink, creator.name]
  );
  const initials = useMemo(() => getInitials(creator.name), [creator.name]);

  const visibleVideos = useMemo(() => {
    if (selectedPlace === "All") return creator.videos;
    return creator.videos.filter((v) =>
      v.places.some((p) => p.toLowerCase() === selectedPlace.toLowerCase())
    );
  }, [creator.videos, selectedPlace]);

  const placeMetaMap = useMemo(
    () => new Map(ALL_PLACES.map((p) => [p.name.toLowerCase(), p])),
    []
  );

  const perDayFromSearch =
    initialBudget && initialDays && initialDays >= 1
      ? Math.round(initialBudget / initialDays)
      : null;

  const budgetStatus = useMemo(() => {
    if (!perDayFromSearch) return null;
    if (creator.budgetMinPerDay > perDayFromSearch) return "over";
    if (creator.budgetMaxPerDay <= perDayFromSearch) return "within";
    return "slightly_over";
  }, [creator.budgetMaxPerDay, creator.budgetMinPerDay, perDayFromSearch]);

  const openVideoLightbox = async (video: FeaturedVideo) => {
    setActiveVideo(video);
    const parsed = parseOfficialEmbed(video.url, video.platform);
    if (parsed && !parsed.isDemoPlaceholder && !oembedCache[video.id]) {
      setLoadingModalEmbed(true);
      try {
        const res = await fetch(
          `/api/oembed?url=${encodeURIComponent(video.url)}`
        );
        if (res.ok) {
          const data = (await res.json()) as OfficialOEmbedResponse;
          setOembedCache((prev) => ({ ...prev, [video.id]: data }));
        }
      } catch {
        // Fallback to direct official iframe URL
      } finally {
        setLoadingModalEmbed(false);
      }
    }
  };

  const handleShareProfile = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = `${creator.name} — Kerala Travel Creator on TravelVlogFinder`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy profile link:", url);
    }
  };

  const activeVideoParsed = activeVideo
    ? parseOfficialEmbed(activeVideo.url, activeVideo.platform)
    : null;
  const activeVideoEmbedUrl = activeVideo
    ? (oembedCache[activeVideo.id]?.embedUrl ?? activeVideoParsed?.embedUrl ?? null)
    : null;

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Minimal Sticky Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>

          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-stone-900">
              {handle}
            </span>
            {creator.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            )}
          </div>

          <button
            type="button"
            onClick={handleShareProfile}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900 sm:text-sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-700" />
                Copied
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 sm:pt-8">
        {/* Clean, Simple Instagram-Style Profile Header */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-9">
            {/* Avatar + Mobile Stats */}
            <div className="flex items-center gap-5 sm:block">
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-stone-200 bg-emerald-900 text-xl font-bold tracking-tight text-white ring-2 ring-stone-200/80 ring-offset-2 sm:h-28 sm:w-28 sm:text-2xl">
                  {initials}
                </div>
                <span className="absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white shadow-xs">
                  <PlatformIcon platform={creator.platform} className="h-3.5 w-3.5" />
                </span>
              </div>

              {/* Mobile Stats */}
              <div className="grid flex-1 grid-cols-3 gap-2 text-center sm:hidden">
                <div>
                  <p className="text-base font-bold text-stone-900">
                    {creator.videos.length}
                  </p>
                  <p className="text-xs text-stone-500">Videos</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">
                    {creator.followersRange.replace(/\s*-\s*/, "–")}
                  </p>
                  <p className="text-xs text-stone-500">Followers</p>
                </div>
                <div>
                  <p className="text-base font-bold text-stone-900">
                    {creator.placesCovered.length}
                  </p>
                  <p className="text-xs text-stone-500">Places</p>
                </div>
              </div>
            </div>

            {/* Profile Identity, Actions & Minimal Stats */}
            <div className="min-w-0 flex-1">
              {/* Row 1: Name + Verified + Single-Line Actions */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
                    {creator.name}
                  </h1>
                  {creator.verified && (
                    <BadgeCheck
                      aria-label="Verified creator"
                      className="h-5 w-5 shrink-0 text-emerald-600"
                    />
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 md:flex-nowrap">
                  <a
                    href={creator.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:flex-none"
                  >
                    Visit {creator.platform === "youtube" ? "YouTube" : "Instagram"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      toggleSave({
                        id: creator.id,
                        name: creator.name,
                        platform: creator.platform,
                        profileLink: creator.profileLink,
                        followersRange: creator.followersRange,
                        placesCovered: creator.placesCovered,
                        travelStyle: creator.travelStyle,
                        language: creator.language,
                        budgetMinPerDay: creator.budgetMinPerDay,
                        budgetMaxPerDay: creator.budgetMaxPerDay,
                        minDays: creator.minDays,
                        maxDays: creator.maxDays,
                        verified: creator.verified,
                        videoCount: creator.videos.length,
                      })
                    }
                    className={`inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 text-sm font-semibold transition ${
                      saved
                        ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                        : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${saved ? "fill-emerald-700 text-emerald-700" : ""}`}
                    />
                    {saved ? "Saved" : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareProfile}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                  >
                    {copied ? "Copied" : "Share"}
                  </button>

                  {!creator.verified && (
                    <button
                      type="button"
                      onClick={() => setClaimOpen(true)}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-600 transition hover:border-emerald-600 hover:text-emerald-800"
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-700" />
                      Claim
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Desktop Stats + Budget Match Tag */}
              <div className="mt-4 hidden flex-wrap items-center gap-x-7 gap-y-2 sm:flex">
                <div className="text-sm text-stone-600">
                  <span className="font-bold text-stone-900">
                    {creator.videos.length}
                  </span>{" "}
                  {creator.videos.length === 1 ? "video" : "videos"}
                </div>
                <div className="text-sm text-stone-600">
                  <span className="font-bold text-stone-900">
                    {creator.followersRange}
                  </span>{" "}
                  followers
                </div>
                <div className="text-sm text-stone-600">
                  <span className="font-bold text-stone-900">
                    {creator.placesCovered.length}
                  </span>{" "}
                  places
                </div>
                {budgetStatus === "within" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Within your budget
                  </span>
                )}
                {budgetStatus === "slightly_over" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Slightly over
                  </span>
                )}
              </div>

              {/* Row 3: Travel Style Subtitle Only */}
              {creator.travelStyle.length > 0 && (
                <p className="mt-3 text-xs font-medium text-stone-500 sm:text-sm">
                  {creator.travelStyle.join("  ·  ")}
                </p>
              )}
            </div>
          </div>

          {/* Minimal Destination Highlights Strip */}
          <div className="mt-7 border-t border-stone-100 pt-5">
            <div className="flex gap-4 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlace("All");
                  setActiveTab("grid");
                }}
                className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border transition ${
                    selectedPlace === "All"
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-600 group-hover:border-stone-400"
                  }`}
                >
                  <Compass className="h-5 w-5" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    selectedPlace === "All"
                      ? "font-semibold text-stone-900"
                      : "text-stone-500"
                  }`}
                >
                  All ({creator.videos.length})
                </span>
              </button>

              {creator.placesCovered.map((placeName) => {
                const isSelected = selectedPlace === placeName;
                const count = creator.videos.filter((v) =>
                  v.places.some(
                    (p) => p.toLowerCase() === placeName.toLowerCase()
                  )
                ).length;
                return (
                  <button
                    key={placeName}
                    type="button"
                    onClick={() => {
                      setSelectedPlace(placeName);
                      setActiveTab("grid");
                    }}
                    className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
                  >
                    <div
                      className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border transition ${
                        isSelected
                          ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                          : "border-stone-200 bg-stone-50 text-stone-600 group-hover:border-stone-400"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                      {count > 0 && (
                        <span className="mt-0.5 text-[10px] font-semibold">
                          {count}
                        </span>
                      )}
                    </div>
                    <span
                      className={`max-w-18 truncate text-xs ${
                        isSelected
                          ? "font-semibold text-stone-900"
                          : "font-medium text-stone-500"
                      }`}
                    >
                      {placeName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Clean Tab Bar */}
        <nav
          aria-label="Profile sections"
          className="mt-6 flex border-b border-stone-200"
        >
          <button
            type="button"
            onClick={() => setActiveTab("grid")}
            className={`flex min-h-12 flex-1 items-center justify-center gap-2 border-b-2 text-xs font-semibold uppercase tracking-wider transition sm:text-sm ${
              activeTab === "grid"
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            Videos ({visibleVideos.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`flex min-h-12 flex-1 items-center justify-center gap-2 border-b-2 text-xs font-semibold uppercase tracking-wider transition sm:text-sm ${
              activeTab === "guide"
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Trip Budget
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("similar")}
            className={`flex min-h-12 flex-1 items-center justify-center gap-2 border-b-2 text-xs font-semibold uppercase tracking-wider transition sm:text-sm ${
              activeTab === "similar"
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Users className="h-4 w-4" />
            Similar ({creator.similarCreators.length})
          </button>
        </nav>

        {/* TAB 1: Clean Video Grid */}
        {activeTab === "grid" && (
          <section className="mt-5">
            {selectedPlace !== "All" && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs text-stone-700 sm:text-sm">
                <span>
                  Filtered by <strong>{selectedPlace}</strong>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlace("All")}
                    className="font-medium text-stone-600 underline hover:text-stone-900"
                  >
                    Show all
                  </button>
                  <Link
                    href={`/?place=${encodeURIComponent(selectedPlace)}&days=${calcDays}&budget=${creator.budgetMaxPerDay * calcDays}`}
                    className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    All {selectedPlace} creators
                  </Link>
                </div>
              </div>
            )}

            {visibleVideos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
                <Video className="mx-auto h-9 w-9 text-stone-300" />
                <p className="mt-2 text-sm font-semibold text-stone-900">
                  No videos tagged for {selectedPlace} yet
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Switch back to All to browse this creator&apos;s other guides.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedPlace("All")}
                  className="mt-4 min-h-10 rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Show all videos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {visibleVideos.map((video) => {
                  const parsed = parseOfficialEmbed(video.url, video.platform);
                  const thumb = parsed?.thumbnailUrl;
                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => openVideoLightbox(video)}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left transition hover:border-stone-300 hover:shadow-md focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={video.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-800 to-emerald-950" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-stone-900 shadow-sm transition group-hover:scale-105">
                            <Play className="ml-0.5 h-4 w-4 fill-current" />
                          </span>
                        </div>
                        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white">
                          <PlatformIcon
                            platform={video.platform}
                            className="h-3 w-3"
                          />
                          {video.platform === "youtube" ? "YouTube" : "Reel"}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-3.5">
                        <div>
                          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">
                              {video.description}
                            </p>
                          )}
                        </div>
                        {video.places.length > 0 && (
                          <p className="mt-2.5 text-[11px] font-medium text-stone-500">
                            {video.places.join(" · ")}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: Interactive Trip Budget & Details */}
        {activeTab === "guide" && (
          <section className="mt-5 space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-stone-900">
                Trip cost estimate
              </h2>
              <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                Select trip days (typical range: {creator.minDays}–
                {creator.maxDays} days).
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCalcDays(d)}
                    className={`min-h-10 min-w-11 rounded-lg px-3 text-sm font-semibold transition ${
                      calcDays === d
                        ? "bg-emerald-700 text-white"
                        : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-medium text-stone-500">
                    Per-day budget
                  </p>
                  <p className="mt-1 text-lg font-bold text-stone-900">
                    Rs {formatInr(creator.budgetMinPerDay)} to{" "}
                    {formatInr(creator.budgetMaxPerDay)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <p className="text-xs font-medium text-emerald-800">
                    Estimated total ({calcDays}{" "}
                    {calcDays === 1 ? "day" : "days"})
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-950">
                    Rs {formatInr(creator.budgetMinPerDay * calcDays)} to{" "}
                    {formatInr(creator.budgetMaxPerDay * calcDays)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
                <span>{BUDGET_DISCLAIMER_NOTE}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Places covered in {creator.region}
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {creator.placesCovered.map((placeName) => {
                  const meta = placeMetaMap.get(placeName.toLowerCase());
                  return (
                    <Link
                      key={placeName}
                      href={`/?place=${encodeURIComponent(placeName)}&days=${calcDays}&budget=${creator.budgetMaxPerDay * calcDays}`}
                      className="flex flex-col rounded-xl border border-stone-200 p-3.5 transition hover:border-emerald-600"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-stone-900">
                          {placeName}
                        </span>
                        {meta && (
                          <span className="text-xs text-stone-500">
                            {meta.district}
                          </span>
                        )}
                      </div>
                      {meta && (
                        <p className="mt-1 text-xs leading-relaxed text-stone-500">
                          {meta.highlights}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-stone-400">
                Languages: {creator.language.join(", ")}
                {creator.bestSeason ? ` · Best season: ${creator.bestSeason}` : ""}
                {" · "}Last checked: {creator.lastChecked}
              </p>
            </div>
          </section>
        )}

        {/* TAB 3: Similar Creators */}
        {activeTab === "similar" && (
          <section className="mt-5">
            {creator.similarCreators.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
                No similar creators found yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {creator.similarCreators.map((sim) => (
                  <Link
                    key={sim.id}
                    href={`/creators/${sim.id}`}
                    className="flex items-center gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-xs"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-sm font-bold text-white">
                      {getInitials(sim.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-stone-900">
                          {sim.name}
                        </p>
                        {sim.verified && (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-stone-600">
                        Rs {formatInr(sim.budgetMinPerDay)} –{" "}
                        {formatInr(sim.budgetMaxPerDay)}/day ·{" "}
                        {sim.followersRange}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-stone-400">
                        {sim.placesCovered.join(" · ")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Official Video Lightbox Modal */}
      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-video-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <PlatformIcon
                  platform={activeVideo.platform}
                  className="h-4 w-4 shrink-0"
                />
                <span className="truncate text-sm font-semibold text-stone-900">
                  {creator.name}
                </span>
                {creator.verified && (
                  <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Close video player"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-stone-950">
              {activeVideoParsed?.isDemoPlaceholder ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 bg-stone-900 p-6 text-center text-white">
                  <Video className="h-7 w-7 text-stone-400" />
                  <p className="text-sm font-semibold">Sample Seed Video Link</p>
                  <p className="max-w-md text-xs leading-relaxed text-stone-300">
                    Real YouTube and Instagram URLs added in Admin or via{" "}
                    <code>/submit</code> play live here inside the official
                    embed player.
                  </p>
                  {activeVideoEmbedUrl && (
                    <code className="max-w-full truncate rounded bg-black/40 px-3 py-1 text-xs text-stone-300">
                      {activeVideoEmbedUrl}
                    </code>
                  )}
                </div>
              ) : loadingModalEmbed ? (
                <div className="flex aspect-video items-center justify-center text-sm text-stone-300">
                  Loading official embed...
                </div>
              ) : activeVideoEmbedUrl ? (
                <div
                  className={
                    activeVideo.platform === "youtube"
                      ? "aspect-video w-full"
                      : "h-[460px] w-full bg-white"
                  }
                >
                  <iframe
                    src={activeVideoEmbedUrl}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-3 p-5">
              <h3
                id="lightbox-video-title"
                className="text-base font-bold text-stone-900"
              >
                {activeVideo.title}
              </h3>
              {activeVideo.description && (
                <p className="text-sm leading-relaxed text-stone-600">
                  {activeVideo.description}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
                <span className="text-xs font-medium text-stone-500">
                  {activeVideo.places.join(" · ")}
                </span>
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Watch on{" "}
                  {activeVideo.platform === "youtube" ? "YouTube" : "Instagram"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {claimOpen && (
        <ClaimProfileModal
          creatorId={creator.id}
          creatorName={creator.name}
          onClose={() => setClaimOpen(false)}
        />
      )}
    </div>
  );
}
