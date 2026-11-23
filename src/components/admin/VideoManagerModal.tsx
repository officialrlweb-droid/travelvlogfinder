"use client";

import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import type {
  AdminCreatorRecord,
  AdminVideoRecord,
} from "@/lib/admin/repository";
import {
  ALL_PLACES,
  PLATFORM_OPTIONS,
  type Platform,
} from "@/lib/constants/taxonomy";
import { parseOfficialEmbed } from "@/lib/embeds/official-embed";
import { PlatformIcon } from "@/components/PlatformIcon";

interface VideoManagerModalProps {
  creator: AdminCreatorRecord;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

export function VideoManagerModal({
  creator,
  onClose,
  onUpdated,
}: VideoManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>(creator.platform);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [places, setPlaces] = useState<string[]>(
    creator.placesCovered.slice(0, 1)
  );
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedEmbed = url.trim() ? parseOfficialEmbed(url.trim()) : null;

  const resetForm = () => {
    setEditingId(null);
    setUrl("");
    setPlatform(creator.platform);
    setTitle("");
    setDescription("");
    setPlaces(creator.placesCovered.slice(0, 1));
    setError(null);
  };

  const startEdit = (video: AdminVideoRecord) => {
    setEditingId(video.id);
    setUrl(video.url);
    setPlatform(video.platform);
    setTitle(video.title);
    setDescription(video.description);
    setPlaces(video.places);
    setError(null);
  };

  const togglePlace = (place: string) => {
    setPlaces((prev) =>
      prev.includes(place) ? prev.filter((p) => p !== place) : [...prev, place]
    );
  };

  const handleUrlChange = (nextUrl: string) => {
    setUrl(nextUrl);
    const detected = parseOfficialEmbed(nextUrl.trim());
    if (detected) {
      setPlatform(detected.platform);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const endpoint = editingId
        ? `/api/admin/videos/${editingId}`
        : "/api/admin/videos";
      const res = await fetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          url,
          platform,
          title,
          description,
          places,
        }),
      });
      const data = (await res.json()) as { error?: string; errors?: string[] };
      if (!res.ok) {
        setError(data.errors?.join(" ") || data.error || "Could not save video.");
        return;
      }
      resetForm();
      await onUpdated();
    } catch {
      setError("Network error while saving video.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    setDeletingId(videoId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Could not delete video.");
        return;
      }
      if (editingId === videoId) {
        resetForm();
      }
      await onUpdated();
    } catch {
      setError("Network error while deleting video.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <h2
                id="video-modal-title"
                className="text-lg font-extrabold text-stone-900"
              >
                Manage videos
              </h2>
              <p className="text-xs text-stone-500">
                {creator.name} · Up to 3 featured videos appear on search cards
                via official embeds.
              </p>
            </div>
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

        {/* Add / Edit Video Form */}
        <form
          onSubmit={handleSave}
          className="mt-4 space-y-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              {editingId ? "Edit video" : "Add featured video"}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-stone-500 hover:text-stone-900"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Official YouTube / Instagram URL *
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://www.instagram.com/reel/..."
                className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
              />
              {url.trim() && (
                <p
                  className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                    parsedEmbed ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {parsedEmbed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Valid official {parsedEmbed.platform} embed URL detected
                    </>
                  ) : (
                    "Enter a valid YouTube (watch, youtu.be, shorts) or Instagram (/reel/, /p/) link."
                  )}
                </p>
              )}
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

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
              Video Title * (indexed for keyword search)
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wayanad 2-Day Budget Itinerary Under Rs 4,500"
              className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
              Description / Highlights (indexed for keyword search)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Places covered, stay names, food tips, local transport costs..."
              className="w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
              Places tagged in this video
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_PLACES.map((p) => {
                const active = places.includes(p.name);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => togglePlace(p.name)}
                    className={`min-h-8 rounded-full px-2.5 text-xs font-semibold transition ${
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

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {saving
              ? "Saving..."
              : editingId
                ? "Update video"
                : "Add video"}
          </button>
        </form>

        {/* Existing Videos List */}
        <div className="mt-5">
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-stone-500">
            Saved videos ({creator.videos.length})
          </h3>

          {creator.videos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
              No videos added yet for this creator.
            </p>
          ) : (
            <div className="space-y-2.5">
              {creator.videos.map((video) => (
                <div
                  key={video.id}
                  className="flex flex-col gap-2.5 rounded-xl border border-stone-200 bg-white p-3.5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <PlatformIcon
                        platform={video.platform}
                        className="h-4 w-4 shrink-0"
                      />
                      <p className="truncate text-sm font-bold text-stone-900">
                        {video.title}
                      </p>
                    </div>
                    {video.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-stone-600">
                        {video.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      {video.places.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
                        >
                          {p}
                        </span>
                      ))}
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-emerald-800"
                      >
                        Open link
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(video)}
                      className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === video.id}
                      onClick={() => handleDelete(video.id)}
                      className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === video.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
