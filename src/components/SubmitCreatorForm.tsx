"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Plus,
  Send,
  Trash2,
  Video,
} from "lucide-react";
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
import { parseOfficialEmbed } from "@/lib/embeds/official-embed";

interface VideoDraft {
  url: string;
  title: string;
  description: string;
  places: string[];
}

export function SubmitCreatorForm() {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [profileLink, setProfileLink] = useState("");
  const [followersRange, setFollowersRange] = useState<string>(
    FOLLOWERS_RANGE_OPTIONS[1]
  );
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [placesCovered, setPlacesCovered] = useState<string[]>(["Wayanad"]);
  const [travelStyle, setTravelStyle] = useState<string[]>([
    TRAVEL_STYLE_OPTIONS[0],
  ]);
  const [language, setLanguage] = useState<string[]>(["Malayalam", "English"]);
  const [budgetMinPerDay, setBudgetMinPerDay] = useState("1500");
  const [budgetMaxPerDay, setBudgetMaxPerDay] = useState("3000");
  const [minDays, setMinDays] = useState("2");
  const [maxDays, setMaxDays] = useState("5");
  const [bestSeason, setBestSeason] = useState<string>(BEST_SEASON_OPTIONS[0]);
  const [bestKnownFor, setBestKnownFor] = useState("");
  const [contact, setContact] = useState("");
  const [sampleVideos, setSampleVideos] = useState<VideoDraft[]>([
    { url: "", title: "", description: "", places: ["Wayanad"] },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleItem = (
    list: string[],
    value: string,
    setter: (next: string[]) => void
  ) => {
    setter(
      list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
    );
  };

  const updateVideo = (idx: number, patch: Partial<VideoDraft>) => {
    setSampleVideos((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, ...patch } : v))
    );
  };

  const addVideoRow = () => {
    if (sampleVideos.length >= 3) return;
    setSampleVideos((prev) => [
      ...prev,
      {
        url: "",
        title: "",
        description: "",
        places: placesCovered.slice(0, 1),
      },
    ]);
  };

  const removeVideoRow = (idx: number) => {
    setSampleVideos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cleanedVideos = sampleVideos
        .filter((v) => v.url.trim() || v.title.trim())
        .map((v) => {
          const parsed = parseOfficialEmbed(v.url.trim());
          return {
            url: v.url.trim(),
            platform: parsed?.platform ?? platform,
            title: v.title.trim(),
            description: v.description.trim(),
            places: v.places.length > 0 ? v.places : placesCovered.slice(0, 1),
          };
        });

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          bestSeason,
          bestKnownFor,
          contact,
          sampleVideos: cleanedVideos,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        errors?: string[];
        message?: string;
      };
      if (!res.ok) {
        setError(data.errors?.join(" ") || data.error || "Submission failed.");
        return;
      }

      setSuccessMsg(
        data.message ||
          "Submitted! An admin will review and publish your page shortly."
      );
    } catch {
      setError("Network error while submitting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      <header className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Compass className="h-5 w-5 text-emerald-200" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                TravelVlogFinder
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3.5 text-xs font-semibold text-white hover:bg-white/20 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Link>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Submit your Kerala travel creator page
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
              Share your YouTube or Instagram page, daily budget range (stay,
              food &amp; local travel only), and up to 3 official video links.
              Once approved by an admin, your profile goes live with a Verified
              badge.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        {successMsg ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-stone-900">
              Creator profile submitted!
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-600">
              {successMsg}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Explore Kerala creators
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccessMsg(null);
                  setName("");
                  setProfileLink("");
                  setBestKnownFor("");
                  setSampleVideos([
                    { url: "", title: "", description: "", places: ["Wayanad"] },
                  ]);
                }}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Submit another page
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8"
          >
            {/* Creator Basics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Creator / Page Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wayanad Wanderer (Akhil)"
                  className="min-h-12 w-full rounded-xl border border-stone-300 px-3.5 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Platform *
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-900 focus:border-emerald-700 focus:outline-none"
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
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Official Profile URL *
                </label>
                <input
                  type="url"
                  required
                  value={profileLink}
                  onChange={(e) => setProfileLink(e.target.value)}
                  placeholder="https://www.youtube.com/@yourchannel"
                  className="min-h-12 w-full rounded-xl border border-stone-300 px-3.5 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Followers Range *
                </label>
                <select
                  value={followersRange}
                  onChange={(e) => setFollowersRange(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-900 focus:border-emerald-700 focus:outline-none"
                >
                  {FOLLOWERS_RANGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Region *
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-900 focus:border-emerald-700 focus:outline-none"
                >
                  {REGIONS.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Best Season
                </label>
                <select
                  value={bestSeason}
                  onChange={(e) => setBestSeason(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-900 focus:border-emerald-700 focus:outline-none"
                >
                  {BEST_SEASON_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budget & Trip Duration */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-700">
                Typical Daily Budget (INR) &amp; Trip Length
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                Stay, food, and local travel only (exclude flights/trains to
                Kerala).
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    Min Rs/day *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={budgetMinPerDay}
                    onChange={(e) => setBudgetMinPerDay(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold text-stone-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    Max Rs/day *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={budgetMaxPerDay}
                    onChange={(e) => setBudgetMaxPerDay(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold text-stone-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    Min days *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={minDays}
                    onChange={(e) => setMinDays(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold text-stone-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    Max days *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={maxDays}
                    onChange={(e) => setMaxDays(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold text-stone-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Places Covered */}
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Kerala Places You Cover *
              </span>
              <div className="flex flex-wrap gap-2">
                {ALL_PLACES.map((p) => {
                  const active = placesCovered.includes(p.name);
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        toggleItem(placesCovered, p.name, setPlacesCovered)
                      }
                      className={`min-h-10 rounded-full px-3.5 text-xs font-semibold transition ${
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

            {/* Travel Style */}
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Travel Style *
              </span>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_STYLE_OPTIONS.map((style) => {
                  const active = travelStyle.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() =>
                        toggleItem(travelStyle, style, setTravelStyle)
                      }
                      className={`min-h-10 rounded-full px-3.5 text-xs font-semibold transition ${
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

            {/* Languages */}
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Languages *
              </span>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const active = language.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleItem(language, lang, setLanguage)}
                      className={`min-h-10 rounded-full px-3.5 text-xs font-semibold transition ${
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

            {/* Best Known For & Contact */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  What are your travel guides best known for?
                </label>
                <textarea
                  rows={3}
                  value={bestKnownFor}
                  onChange={(e) => setBestKnownFor(e.target.value)}
                  placeholder="e.g. Detailed KSRTC bus guides, homestay costs, hidden waterfalls, authentic Malabar eateries..."
                  className="w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Your Contact (email / WhatsApp / handle — private for admin
                  review) *
                </label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="you@example.com or @yourhandle"
                  className="min-h-12 w-full rounded-xl border border-stone-300 px-3.5 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Up to 3 Official Video Links */}
            <div className="space-y-3 border-t border-stone-100 pt-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-emerald-700" />
                  <h2 className="text-sm font-bold text-stone-900">
                    Featured Videos (Optional, up to 3)
                  </h2>
                </div>
                {sampleVideos.length < 3 && (
                  <button
                    type="button"
                    onClick={addVideoRow}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add video
                  </button>
                )}
              </div>

              {sampleVideos.map((vid, idx) => (
                <div
                  key={idx}
                  className="space-y-2.5 rounded-2xl border border-stone-200 bg-stone-50/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600">
                      Video #{idx + 1}
                    </span>
                    {sampleVideos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVideoRow(idx)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="url"
                    value={vid.url}
                    onChange={(e) => updateVideo(idx, { url: e.target.value })}
                    placeholder="Official YouTube (watch / youtu.be / shorts) or Instagram (/reel/ / /p/) URL"
                    className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={vid.title}
                    onChange={(e) =>
                      updateVideo(idx, { title: e.target.value })
                    }
                    placeholder="Video title (e.g. Wayanad 2-Day Budget Guide)"
                    className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={vid.description}
                    onChange={(e) =>
                      updateVideo(idx, { description: e.target.value })
                    }
                    placeholder="Short highlights (places, stays, food tips)"
                    className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit creator page for review"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
