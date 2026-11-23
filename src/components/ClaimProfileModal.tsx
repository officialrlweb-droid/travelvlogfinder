"use client";

import { useState, type FormEvent } from "react";
import { BadgeCheck, CheckCircle2, X } from "lucide-react";

interface ClaimProfileModalProps {
  creatorId: string;
  creatorName: string;
  onClose: () => void;
}

export function ClaimProfileModal({
  creatorId,
  creatorName,
  onClose,
}: ClaimProfileModalProps) {
  const [contact, setContact] = useState("");
  const [verificationLink, setVerificationLink] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          contact,
          verificationLink,
          notes,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "Could not submit claim.");
      } else {
        setSuccessMessage(
          data.message || "Claim received for admin verification."
        );
      }
    } catch {
      setError("Network error while submitting your claim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <h3
                id="claim-modal-title"
                className="text-base font-bold text-stone-900"
              >
                Claim this profile
              </h3>
              <p className="text-xs text-stone-500">{creatorName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              Verification request submitted
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-emerald-800">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 min-h-11 w-full rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-stone-600">
              Are you the creator behind this page? Share your contact and a
              public link from your YouTube or Instagram bio/post so an admin
              can verify and add a <strong>Verified</strong> badge.
            </p>

            <div>
              <label
                htmlFor="claim-contact"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600"
              >
                Your contact (email or WhatsApp/handle)
              </label>
              <input
                id="claim-contact"
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="you@example.com or @yourhandle"
                className="min-h-12 w-full rounded-xl border border-stone-300 px-3.5 text-sm text-stone-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="claim-verification-link"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600"
              >
                Verification link
              </label>
              <input
                id="claim-verification-link"
                type="url"
                required
                value={verificationLink}
                onChange={(e) => setVerificationLink(e.target.value)}
                placeholder="https://www.instagram.com/yourhandle/ or YouTube About URL"
                className="min-h-12 w-full rounded-xl border border-stone-300 px-3.5 text-sm text-stone-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="claim-notes"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600"
              >
                Optional note
              </label>
              <textarea
                id="claim-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any budget updates or featured video links you'd like updated"
                className="w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="flex gap-2.5 pt-1">
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
                className="min-h-12 flex-1 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit claim"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
