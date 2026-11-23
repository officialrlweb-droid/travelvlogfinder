"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { AdminCreatorRecord } from "@/lib/admin/repository";
import {
  ALL_PLACES,
  BEST_SEASON_OPTIONS,
  DEFAULT_REGION,
  FOLLOWERS_RANGE_OPTIONS,
  LANGUAGE_OPTIONS,
  PLATFORM_OPTIONS,
  REGIONS,
  TRAVEL_STYLE_OPTIONS,
  type Platform,
} from "@/lib/constants/taxonomy";

interface CreatorFormModalProps {
  creator: AdminCreatorRecord | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function CreatorFormModal({
  creator,
  onClose,
  onSaved,
}: CreatorFormModalProps) {
  const isEditing = Boolean(creator);
  const todayIso = new Date().toISOString().slice(0, 10);

  const [name, setName] = useState(creator?.name ?? "");
  const [platform, setPlatform] = useState<Platform>(
    creator?.platform ?? "youtube"
  );
  const [profileLink, setProfileLink] = useState(creator?.profileLink ?? "");
  const [followersRange, setFollowersRange] = useState<string>(
    creator?.followersRange ?? FOLLOWERS_RANGE_OPTIONS[1]
  );
  const [region, setRegion] = useState(creator?.region ?? DEFAULT_REGION);
  const [placesCovered, setPlacesCovered] = useState<string[]>(
    creator?.placesCovered ?? ["Wayanad"]
  );
  const [travelStyle, setTravelStyle] = useState<string[]>(
    creator?.travelStyle ?? [TRAVEL_STYLE_OPTIONS[0]]
  );
  const [language, setLanguage] = useState<string[]>(
    creator?.language ?? ["Malayalam", "English"]
  );
  const [budgetMinPerDay, setBudgetMinPerDay] = useState(
    String(creator?.budgetMinPerDay ?? 1500)
  );
  const [budgetMaxPerDay, setBudgetMaxPerDay] = useState(
    String(creator?.budgetMaxPerDay ?? 2500)
  );
  const [minDays, setMinDays] = useState(String(creator?.minDays ?? 2));
  const [maxDays, setMaxDays] = useState(String(creator?.maxDays ?? 4));
  const [bestKnownFor, setBestKnownFor] = useState(creator?.bestKnownFor ?? "");
  const [bestSeason, setBestSeason] = useState<string>(
    creator?.bestSeason || BEST_SEASON_OPTIONS[0]
  );
  const [contact, setContact] = useState(creator?.contact ?? "");
  const [verified, setVerified] = useState(creator?.verified ?? false);
  const [lastChecked, setLastChecked] = useState(
    creator?.lastChecked ?? todayIso
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (
    list: string[],
    value: string,
    setter: (next: string[]) => void
  ) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      name,
      platform,
      profileLink,
      followersRange,
      region,
      placesCovered,
      travelStyle,
      language,
      budgetMinPerDay: Number(budgetMinPerDay),
      budgetMaxPerDay: Number(budgetMaxPerDay),
      minDays: Number(minDays),
      maxDays: Number(maxDays),
      bestKnownFor,
      bestSeason,
      contact,
      verified,
      lastChecked,
    };

    try {
      const endpoint = isEditing
        ? `/api/admin/creators/${creator!.id}`
        : "/api/admin/creators";
      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string; errors?: string[] };
      if (!res.ok) {
        setError(data.errors?.join(" ") || data.error || "Could not save creator.");
        return;
      }

      await onSaved();
      onClose();
    } catch {
      setError("Network error while saving creator.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2
              id="creator-modal-title"
              className="text-lg font-extrabold text-stone-900"
            >
              {isEditing ? "Edit creator" : "Add new creator"}
            </h2>
            <p className="text-xs text-stone-500">
              Fixed dropdowns keep travel style, language, place, and platform
              filters clean.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Identity */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Creator / Page Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wayanad Explorer (Rahul)"
                className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Platform (Fixed) *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 focus:border-emerald-700 focus:outline-none"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Profile Link *
              </label>
              <input
                type="url"
                required
                value={profileLink}
                onChange={(e) => setProfileLink(e.target.value)}
                placeholder="https://www.youtube.com/@channel"
                className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Followers Range (Fixed) *
              </label>
              <select
                value={followersRange}
                onChange={(e) => setFollowersRange(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 focus:border-emerald-700 focus:outline-none"
              >
                {FOLLOWERS_RANGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Region & Best Season */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Region (Fixed) *
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 focus:border-emerald-700 focus:outline-none"
              >
                {REGIONS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Best Season (Fixed)
              </label>
              <select
                value={bestSeason}
                onChange={(e) => setBestSeason(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 focus:border-emerald-700 focus:outline-none"
              >
                {BEST_SEASON_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget & Days */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Min Rs/day *
              </label>
              <input
                type="number"
                required
                min={0}
                step={100}
                value={budgetMinPerDay}
                onChange={(e) => setBudgetMinPerDay(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Max Rs/day *
              </label>
              <input
                type="number"
                required
                min={0}
                step={100}
                value={budgetMaxPerDay}
                onChange={(e) => setBudgetMaxPerDay(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Min days *
              </label>
              <input
                type="number"
                required
                min={1}
                max={60}
                value={minDays}
                onChange={(e) => setMinDays(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Max days *
              </label>
              <input
                type="number"
                required
                min={1}
                max={60}
                value={maxDays}
                onChange={(e) => setMaxDays(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Places Covered (Fixed multi-select) */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-600">
              Places Covered (Select at least 1) *
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_PLACES.map((p) => {
                const active = placesCovered.includes(p.name);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      toggleItem(placesCovered, p.name, setPlacesCovered)
                    }
                    className={`min-h-9 rounded-full px-3 text-xs font-semibold transition ${
                      active
                        ? "bg-emerald-700 text-white"
                        : "border border-stone-300 bg-white text-stone-700 hover:border-emerald-600"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Travel Style (Fixed multi-select) */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-600">
              Travel Style (Fixed multi-select) *
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TRAVEL_STYLE_OPTIONS.map((style) => {
                const active = travelStyle.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      toggleItem(travelStyle, style, setTravelStyle)
                    }
                    className={`min-h-9 rounded-full px-3 text-xs font-semibold transition ${
                      active
                        ? "bg-emerald-700 text-white"
                        : "border border-stone-300 bg-white text-stone-700 hover:border-emerald-600"
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Languages (Fixed multi-select) */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-600">
              Languages (Fixed multi-select) *
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGE_OPTIONS.map((lang) => {
                const active = language.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleItem(language, lang, setLanguage)}
                    className={`min-h-9 rounded-full px-3 text-xs font-semibold transition ${
                      active
                        ? "bg-emerald-700 text-white"
                        : "border border-stone-300 bg-white text-stone-700 hover:border-emerald-600"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Best known for */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
              Best Known For (indexed for keyword search)
            </label>
            <textarea
              rows={3}
              value={bestKnownFor}
              onChange={(e) => setBestKnownFor(e.target.value)}
              placeholder="e.g. Budget homestays in Kalpetta, KSRTC bus routes, Chembra Peak trekking tips..."
              className="w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          {/* Contact, Last checked, Verified */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Contact (private admin field)
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="email or @handle"
                className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Last Checked
              </label>
              <input
                type="date"
                value={lastChecked}
                onChange={(e) => setLastChecked(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <label className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="h-4 w-4 accent-emerald-700"
                />
                <span className="text-sm font-semibold text-stone-800">
                  Verified profile
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-2.5 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-12 flex-1 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create creator"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
