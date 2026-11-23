"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Calendar,
  Compass,
  ExternalLink,
  Globe,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { CreatorSearchResult } from "@/lib/search/types";
import { ClaimProfileModal } from "./ClaimProfileModal";
import { PlatformIcon } from "./PlatformIcon";
import { VideoEmbedCard } from "./VideoEmbedCard";

interface CreatorCardProps {
  creator: CreatorSearchResult;
  selectedPlace: string | null;
  selectedDays: number | null;
}

function formatInr(amount: number): string {
  return Math.round(amount).toLocaleString("en-IN");
}

export function CreatorCard({
  creator,
  selectedPlace,
  selectedDays,
}: CreatorCardProps) {
  const [claimOpen, setClaimOpen] = useState(false);

  const dayCountLabel =
    selectedDays !== null
      ? `${selectedDays} ${selectedDays === 1 ? "day" : "days"}`
      : null;

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs transition hover:border-emerald-200 hover:shadow-md">
        <div className="p-5 sm:p-6">
          {/* Card Header: Creator identity + Budget fit tag */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 ring-1 ring-stone-200/80">
                  <PlatformIcon platform={creator.platform} className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-bold tracking-tight text-stone-900 sm:text-xl">
                  {creator.name}
                </h3>
                {creator.verified && (
                  <span
                    title="Verified creator profile"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
                  >
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-stone-600">
                <span className="inline-flex items-center gap-1.5 capitalize">
                  {creator.platform === "youtube" ? "YouTube" : "Instagram"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-stone-400" />
                  {creator.followersRange} followers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  Covers {creator.minDays}-{creator.maxDays} day trips
                </span>
                {creator.bestSeason && (
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-stone-400" />
                    {creator.bestSeason}
                  </span>
                )}
              </div>
            </div>

            {creator.budgetFit && (
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {creator.budgetMatchLevel === "exact" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                    Exact match
                  </span>
                )}
                {creator.budgetFit === "within" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    Within your budget
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Slightly over
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Budget Summary Strip */}
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-stone-200/80 bg-stone-50/80 p-3.5 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-stone-200">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Budget per day
                </p>
                <p className="text-base font-bold text-stone-900">
                  Rs {formatInr(creator.budgetMinPerDay)} to{" "}
                  {formatInr(creator.budgetMaxPerDay)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 border-t border-stone-200/70 pt-2.5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-stone-200">
                <Compass className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  {dayCountLabel
                    ? `Estimated total (${dayCountLabel})`
                    : `Typical ${creator.minDays}-${creator.maxDays} day range`}
                </p>
                {creator.estimatedTotalMin !== null &&
                creator.estimatedTotalMax !== null ? (
                  <p className="text-base font-bold text-stone-900">
                    Rs {formatInr(creator.estimatedTotalMin)} to{" "}
                    {formatInr(creator.estimatedTotalMax)}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-stone-700">
                    Enter trip days above for total estimate
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Best known for */}
          {creator.bestKnownFor && (
            <p className="mt-4 text-sm leading-relaxed text-stone-700">
              {creator.bestKnownFor}
            </p>
          )}

          {/* Places, Style Tags, and Language Tags */}
          <div className="mt-4 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-stone-500">
                <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                Places:
              </span>
              {creator.placesCovered.map((placeName) => {
                const isMatched =
                  selectedPlace &&
                  placeName.toLowerCase() === selectedPlace.toLowerCase();
                return (
                  <span
                    key={placeName}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isMatched
                        ? "bg-emerald-700 text-white"
                        : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/70"
                    }`}
                  >
                    {placeName}
                  </span>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold text-stone-500">
                Style:
              </span>
              {creator.travelStyle.map((style) => (
                <span
                  key={style}
                  className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700"
                >
                  {style}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-stone-500">
                <Globe className="h-3.5 w-3.5 text-stone-400" />
                Languages:
              </span>
              {creator.language.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-xs font-medium text-stone-700"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Up to 3 Featured Videos (Official oEmbed/embed) */}
          {creator.featuredVideos.length > 0 && (
            <div className="mt-5 border-t border-stone-100 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Featured Videos ({creator.featuredVideos.length})
                </h4>
                <span className="text-[11px] text-stone-400">
                  Official embeds only
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {creator.featuredVideos.slice(0, 3).map((video) => (
                  <VideoEmbedCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}

          {/* Card Footer Actions */}
          <div className="mt-5 flex flex-col gap-2.5 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={creator.profileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:outline-none sm:w-auto"
              >
                View profile
                <ExternalLink className="h-4 w-4" />
              </a>

              {!creator.verified && (
                <button
                  type="button"
                  onClick={() => setClaimOpen(true)}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:border-emerald-600 hover:text-emerald-800 sm:w-auto"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Claim this profile
                </button>
              )}
            </div>

            <span className="text-xs text-stone-400">
              Last checked: {creator.lastChecked}
            </span>
          </div>
        </div>
      </article>

      {claimOpen && (
        <ClaimProfileModal
          creatorId={creator.id}
          creatorName={creator.name}
          onClose={() => setClaimOpen(false)}
        />
      )}
    </>
  );
}
