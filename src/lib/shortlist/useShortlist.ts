"use client";

import { useCallback, useEffect, useState } from "react";
import type { Platform } from "@/lib/constants/taxonomy";

export interface SavedCreatorItem {
  id: string;
  name: string;
  platform: Platform;
  profileLink: string;
  followersRange: string;
  placesCovered: string[];
  travelStyle: string[];
  language: string[];
  budgetMinPerDay: number;
  budgetMaxPerDay: number;
  minDays: number;
  maxDays: number;
  verified: boolean;
  videoCount: number;
}

const STORAGE_KEY = "tvf_saved_creators_v1";
const SYNC_EVENT = "tvf-shortlist-updated";

function readStorage(): SavedCreatorItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedCreatorItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: SavedCreatorItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(SYNC_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function useShortlist() {
  const [items, setItems] = useState<SavedCreatorItem[]>([]);

  useEffect(() => {
    setItems(readStorage());
    const sync = () => setItems(readStorage());
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isSaved = useCallback(
    (creatorId: string) => items.some((i) => i.id === creatorId),
    [items]
  );

  const toggleSave = useCallback((creator: SavedCreatorItem) => {
    const current = readStorage();
    const exists = current.some((i) => i.id === creator.id);
    const next = exists
      ? current.filter((i) => i.id !== creator.id)
      : [creator, ...current].slice(0, 12);
    writeStorage(next);
    setItems(next);
  }, []);

  const saveMany = useCallback((creators: SavedCreatorItem[]) => {
    const current = readStorage();
    const map = new Map(current.map((c) => [c.id, c]));
    for (const c of creators) {
      map.set(c.id, c);
    }
    const next = Array.from(map.values()).slice(0, 12);
    writeStorage(next);
    setItems(next);
  }, []);

  const removeItem = useCallback((creatorId: string) => {
    const next = readStorage().filter((i) => i.id !== creatorId);
    writeStorage(next);
    setItems(next);
  }, []);

  const clearAll = useCallback(() => {
    writeStorage([]);
    setItems([]);
  }, []);

  return {
    items,
    isSaved,
    toggleSave,
    saveMany,
    removeItem,
    clearAll,
  };
}

export function buildWhatsAppShortlistMessage(options: {
  items: SavedCreatorItem[];
  tripLabel?: string | null;
  days?: number | null;
  travelers?: number;
  originUrl?: string;
}): string {
  const { items, tripLabel, days, travelers = 1, originUrl = "" } = options;
  const lines: string[] = [];

  lines.push(
    tripLabel
      ? `Kerala Trip Creator Shortlist — ${tripLabel}`
      : "Kerala Trip Creator Shortlist (TravelVlogFinder)"
  );
  lines.push("");

  items.forEach((c, idx) => {
    const minStr = c.budgetMinPerDay.toLocaleString("en-IN");
    const maxStr = c.budgetMaxPerDay.toLocaleString("en-IN");
    const totalSuffix =
      days && days >= 1
        ? ` | Est. ${days}d: Rs ${(c.budgetMinPerDay * days).toLocaleString(
            "en-IN"
          )}-${(c.budgetMaxPerDay * days).toLocaleString("en-IN")}${
            travelers > 1 ? "/person" : ""
          }`
        : "";
    lines.push(
      `${idx + 1}. ${c.name} (${
        c.platform === "youtube" ? "YouTube" : "Instagram"
      }) — Rs ${minStr}-${maxStr}/day${totalSuffix}`
    );
    lines.push(`   Places: ${c.placesCovered.join(", ")}`);
    if (originUrl) {
      lines.push(`   ${originUrl}/creators/${c.id}`);
    }
  });

  if (originUrl) {
    lines.push("");
    lines.push(`Browse more on TravelVlogFinder: ${originUrl}`);
  }

  return lines.join("\n");
}
