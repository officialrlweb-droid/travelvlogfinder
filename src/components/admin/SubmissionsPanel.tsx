"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Check,
  Clock,
  ExternalLink,
  Inbox,
  Mail,
  Video,
  X,
} from "lucide-react";
import type { AdminSubmissionRecord } from "@/lib/admin/repository";
import { PlatformIcon } from "@/components/PlatformIcon";

interface SubmissionsPanelProps {
  submissions: AdminSubmissionRecord[];
  onUpdated: () => Promise<void>;
}

export function SubmissionsPanel({
  submissions,
  onUpdated,
}: SubmissionsPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not update submission.");
        return;
      }
      await onUpdated();
    } catch {
      setError("Network error while updating submission.");
    } finally {
      setBusyId(null);
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
        <Inbox className="mx-auto h-9 w-9 text-stone-300" />
        <p className="mt-2 text-base font-bold text-stone-900">
          No creator submissions yet
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
          Share <code>/submit</code> with Kerala travel creators. Submitted
          profiles and video links appear here for 1-click approval and live
          publishing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      {submissions.map((sub) => {
        const isPending = sub.status === "pending";
        return (
          <div
            key={sub.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformIcon platform={sub.platform} className="h-4 w-4" />
                  <h3 className="text-base font-bold text-stone-900">
                    {sub.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                      sub.status === "pending"
                        ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                        : sub.status === "approved"
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {sub.status === "pending" && <Clock className="h-3 w-3" />}
                    {sub.status === "approved" && (
                      <BadgeCheck className="h-3 w-3" />
                    )}
                    {sub.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-stone-600">
                  <span>
                    Rs {sub.budgetMinPerDay.toLocaleString("en-IN")} to{" "}
                    {sub.budgetMaxPerDay.toLocaleString("en-IN")}/day
                  </span>
                  <span>
                    {sub.minDays}-{sub.maxDays} days
                  </span>
                  <span>{sub.followersRange}</span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-stone-400" />
                    {sub.contact}
                  </span>
                  <a
                    href={sub.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
                  >
                    Open profile
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {sub.bestKnownFor && (
                  <p className="text-sm text-stone-700">{sub.bestKnownFor}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {sub.placesCovered.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900"
                    >
                      {p}
                    </span>
                  ))}
                  {sub.travelStyle.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700"
                    >
                      {s}
                    </span>
                  ))}
                  {sub.language.map((l) => (
                    <span
                      key={l}
                      className="rounded-full border border-stone-200 px-2 py-0.5 text-xs text-stone-600"
                    >
                      {l}
                    </span>
                  ))}
                </div>

                {sub.sampleVideos.length > 0 && (
                  <div className="rounded-xl bg-stone-50 p-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-600">
                      <Video className="h-3.5 w-3.5 text-emerald-700" />
                      Submitted videos ({sub.sampleVideos.length})
                    </p>
                    <ul className="space-y-1 text-xs">
                      {sub.sampleVideos.map((v, idx) => (
                        <li
                          key={idx}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-stone-800">
                            {v.title}
                          </span>
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
                          >
                            Check link
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {isPending && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId === sub.id}
                    onClick={() => handleReview(sub.id, "approve")}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    Approve &amp; Publish
                  </button>
                  <button
                    type="button"
                    disabled={busyId === sub.id}
                    onClick={() => handleReview(sub.id, "reject")}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
