"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bookmark,
  Check,
  Columns3,
  Copy,
  ExternalLink,
  MessageCircle,
  Trash2,
  X,
} from "lucide-react";
import {
  buildWhatsAppShortlistMessage,
  type SavedCreatorItem,
} from "@/lib/shortlist/useShortlist";
import { PlatformIcon } from "./PlatformIcon";

interface TripBoardDrawerProps {
  items: SavedCreatorItem[];
  initialView?: "shortlist" | "compare";
  days: number | null;
  travelers: number;
  tripLabel: string | null;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

function formatInr(amount: number): string {
  return Math.round(amount).toLocaleString("en-IN");
}

export function TripBoardDrawer({
  items,
  initialView = "shortlist",
  days,
  travelers,
  tripLabel,
  onRemove,
  onClearAll,
  onClose,
}: TripBoardDrawerProps) {
  const [view, setView] = useState<"shortlist" | "compare">(
    initialView === "compare" && items.length >= 2 ? "compare" : "shortlist"
  );
  const [compareIds, setCompareIds] = useState<string[]>(() =>
    items.slice(0, 3).map((i) => i.id)
  );
  const [copied, setCopied] = useState(false);

  const comparedItems = useMemo(() => {
    const valid = items.filter((i) => compareIds.includes(i.id)).slice(0, 3);
    if (valid.length > 0) return valid;
    return items.slice(0, 3);
  }, [items, compareIds]);

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const getOrigin = () =>
    typeof window !== "undefined" ? window.location.origin : "";

  const handleWhatsAppShare = () => {
    const text = buildWhatsAppShortlistMessage({
      items,
      tripLabel,
      days,
      travelers,
      originUrl: getOrigin(),
    });
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyShortlist = async () => {
    const text = buildWhatsAppShortlistMessage({
      items,
      tripLabel,
      days,
      travelers,
      originUrl: getOrigin(),
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy your shortlist:", text);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trip Board & Side-by-Side Compare"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Bookmark className="h-5 w-5 text-emerald-700" />
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Trip Board ({items.length})
              </h2>
              {tripLabel && (
                <p className="text-xs text-stone-500">{tripLabel}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Trip Board"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher + Share Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/70 px-5 py-3">
          <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView("shortlist")}
              className={`min-h-9 rounded-md px-3.5 text-xs font-semibold transition ${
                view === "shortlist"
                  ? "bg-emerald-700 text-white"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Shortlist ({items.length})
            </button>
            <button
              type="button"
              disabled={items.length < 2}
              onClick={() => setView("compare")}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3.5 text-xs font-semibold transition disabled:opacity-40 ${
                view === "compare"
                  ? "bg-emerald-700 text-white"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Compare ({Math.min(items.length, 3)})
            </button>
          </div>

          {items.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={handleCopyShortlist}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy text
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-stone-500 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <Bookmark className="mx-auto h-9 w-9 text-stone-300" />
              <p className="mt-2 text-sm font-semibold text-stone-900">
                Your Trip Board is empty
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Tap Save on any creator to shortlist, compare side-by-side, or
                share to your WhatsApp group.
              </p>
            </div>
          ) : view === "shortlist" ? (
            <div className="space-y-3">
              {items.map((creator) => {
                const estMin = days ? creator.budgetMinPerDay * days : null;
                const estMax = days ? creator.budgetMaxPerDay * days : null;
                return (
                  <div
                    key={creator.id}
                    className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <PlatformIcon
                          platform={creator.platform}
                          className="h-4 w-4 shrink-0"
                        />
                        <Link
                          href={`/creators/${creator.id}`}
                          onClick={onClose}
                          className="truncate text-sm font-bold text-stone-900 hover:text-emerald-800 hover:underline"
                        >
                          {creator.name}
                        </Link>
                        {creator.verified && (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-stone-600">
                        <strong className="text-stone-900">
                          Rs {formatInr(creator.budgetMinPerDay)} –{" "}
                          {formatInr(creator.budgetMaxPerDay)}/day
                        </strong>
                        {estMin !== null && estMax !== null
                          ? ` · Est. ${days}d: Rs ${formatInr(estMin)} – ${formatInr(estMax)}`
                          : ""}
                        {travelers > 1 && estMin !== null && estMax !== null
                          ? ` (Rs ${formatInr(estMin * travelers)} – ${formatInr(
                              estMax * travelers
                            )} for ${travelers})`
                          : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {creator.placesCovered.join(" · ")} ·{" "}
                        {creator.language.join(", ")}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/creators/${creator.id}`}
                        onClick={onClose}
                        className="inline-flex min-h-9 items-center rounded-lg border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Profile
                      </Link>
                      <a
                        href={creator.profileLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"
                      >
                        Channel
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onRemove(creator.id)}
                        aria-label={`Remove ${creator.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {items.length > 3 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-stone-500">
                    Pick up to 3 to compare:
                  </span>
                  {items.map((item) => {
                    const active = comparedItems.some((c) => c.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCompareId(item.id)}
                        className={`rounded-full px-2.5 py-1 font-semibold transition ${
                          active
                            ? "bg-emerald-700 text-white"
                            : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        {item.name.split("(")[0].trim()}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full min-w-[560px] border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="w-36 p-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Compare
                      </th>
                      {comparedItems.map((c) => (
                        <th key={c.id} className="p-3 align-top">
                          <div className="flex items-center gap-1.5">
                            <PlatformIcon
                              platform={c.platform}
                              className="h-4 w-4 shrink-0"
                            />
                            <Link
                              href={`/creators/${c.id}`}
                              onClick={onClose}
                              className="font-bold text-stone-900 hover:text-emerald-800 hover:underline"
                            >
                              {c.name}
                            </Link>
                            {c.verified && (
                              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="p-3 font-semibold text-stone-500">
                        Budget / day
                      </td>
                      {comparedItems.map((c) => (
                        <td
                          key={c.id}
                          className="p-3 font-bold text-emerald-900"
                        >
                          Rs {formatInr(c.budgetMinPerDay)} –{" "}
                          {formatInr(c.budgetMaxPerDay)}
                        </td>
                      ))}
                    </tr>
                    {days && (
                      <tr>
                        <td className="p-3 font-semibold text-stone-500">
                          Est. total ({days}d)
                        </td>
                        {comparedItems.map((c) => (
                          <td key={c.id} className="p-3 font-semibold text-stone-900">
                            Rs {formatInr(c.budgetMinPerDay * days)} –{" "}
                            {formatInr(c.budgetMaxPerDay * days)}
                            {travelers > 1 && (
                              <span className="mt-0.5 block text-xs font-normal text-stone-500">
                                Group ({travelers}): Rs{" "}
                                {formatInr(c.budgetMinPerDay * days * travelers)} –{" "}
                                {formatInr(c.budgetMaxPerDay * days * travelers)}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )}
                    <tr>
                      <td className="p-3 font-semibold text-stone-500">
                        Days covered
                      </td>
                      {comparedItems.map((c) => (
                        <td key={c.id} className="p-3 text-stone-700">
                          {c.minDays}–{c.maxDays} days
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-stone-500">
                        Followers
                      </td>
                      {comparedItems.map((c) => (
                        <td key={c.id} className="p-3 text-stone-700">
                          {c.followersRange}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-stone-500">
                        Places
                      </td>
                      {comparedItems.map((c) => (
                        <td key={c.id} className="p-3 text-stone-700">
                          {c.placesCovered.join(", ")}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-stone-500">
                        Languages
                      </td>
                      {comparedItems.map((c) => (
                        <td key={c.id} className="p-3 text-stone-700">
                          {c.language.join(", ")}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-stone-500">
                        Travel style
                      </td>
                      {comparedItems.map((c) => (
                        <td key={c.id} className="p-3 text-stone-700">
                          {c.travelStyle.join(", ")}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-stone-500">
                        Links
                      </td>
                      {comparedItems.map((c) => (
                        <td key={c.id} className="p-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Link
                              href={`/creators/${c.id}`}
                              onClick={onClose}
                              className="inline-flex min-h-8 items-center rounded-md border border-stone-300 px-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                            >
                              Profile
                            </Link>
                            <a
                              href={c.profileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-8 items-center gap-1 rounded-md bg-emerald-700 px-2.5 text-xs font-semibold text-white hover:bg-emerald-800"
                            >
                              Visit
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
