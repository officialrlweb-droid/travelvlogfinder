"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Check,
  Clock,
  ExternalLink,
  Mail,
  X,
} from "lucide-react";
import type { AdminClaimRecord } from "@/lib/admin/repository";
import { PlatformIcon } from "@/components/PlatformIcon";

interface ClaimsPanelProps {
  claims: AdminClaimRecord[];
  onUpdated: () => Promise<void>;
}

export function ClaimsPanel({ claims, onUpdated }: ClaimsPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (
    claimId: string,
    action: "approve" | "reject"
  ) => {
    setBusyId(claimId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not update claim.");
        return;
      }
      await onUpdated();
    } catch {
      setError("Network error while updating claim.");
    } finally {
      setBusyId(null);
    }
  };

  if (claims.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
        <BadgeCheck className="mx-auto h-9 w-9 text-stone-300" />
        <p className="mt-2 text-base font-bold text-stone-900">
          No profile claims yet
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
          When creators click &ldquo;Claim this profile&rdquo; on an unverified
          card and submit their contact and verification link, their requests
          appear here for approval.
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

      {claims.map((claim) => {
        const isPending = claim.status === "pending";
        return (
          <div
            key={claim.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformIcon
                    platform={claim.creatorPlatform}
                    className="h-4 w-4"
                  />
                  <h3 className="text-base font-bold text-stone-900">
                    {claim.creatorName}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                      claim.status === "pending"
                        ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                        : claim.status === "approved"
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {claim.status === "pending" && <Clock className="h-3 w-3" />}
                    {claim.status === "approved" && (
                      <BadgeCheck className="h-3 w-3" />
                    )}
                    {claim.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-stone-400" />
                    <strong>Contact:</strong> {claim.contact}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <a
                    href={claim.verificationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
                  >
                    Open verification link
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={claim.creatorProfileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-stone-500 hover:text-stone-800 hover:underline"
                  >
                    Compare profile link
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {claim.notes && (
                  <p className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-700">
                    <strong>Note:</strong> {claim.notes}
                  </p>
                )}
              </div>

              {isPending && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId === claim.id}
                    onClick={() => handleAction(claim.id, "approve")}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    Approve &amp; Verify
                  </button>
                  <button
                    type="button"
                    disabled={busyId === claim.id}
                    onClick={() => handleAction(claim.id, "reject")}
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
