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

export interface CreatorMutationInput {
  name: string;
  platform: Platform;
  profileLink: string;
  followersRange: string;
  region: string;
  placesCovered: string[];
  travelStyle: string[];
  budgetMinPerDay: number;
  budgetMaxPerDay: number;
  minDays: number;
  maxDays: number;
  language: string[];
  bestKnownFor: string;
  bestSeason: string;
  contact: string;
  verified: boolean;
  lastChecked: string;
}

export interface VideoMutationInput {
  creatorId: string;
  url: string;
  platform: Platform;
  title: string;
  description: string;
  places: string[];
}

const REGION_MAP = new Map(REGIONS.map((r) => [r.name.toLowerCase(), r.name]));
const PLACE_MAP = new Map(ALL_PLACES.map((p) => [p.name.toLowerCase(), p.name]));
const PLATFORM_MAP = new Map(
  PLATFORM_OPTIONS.flatMap((p) => [
    [p.value.toLowerCase(), p.value],
    [p.label.toLowerCase(), p.value],
  ])
);
const STYLE_MAP = new Map(
  TRAVEL_STYLE_OPTIONS.map((s) => [s.toLowerCase(), s])
);
const LANGUAGE_MAP = new Map(
  LANGUAGE_OPTIONS.map((l) => [l.toLowerCase(), l])
);
const FOLLOWERS_MAP = new Map(
  FOLLOWERS_RANGE_OPTIONS.map((f) => [f.toLowerCase().replace(/\s+/g, " "), f])
);
const SEASON_MAP = new Map(
  BEST_SEASON_OPTIONS.map((s) => [s.toLowerCase(), s])
);

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeCanonicalList(
  values: unknown,
  lookup: Map<string, string>,
  fieldLabel: string,
  errors: string[],
  required = true
): string[] {
  const rawArr = Array.isArray(values)
    ? values.map((v) => String(v).trim()).filter(Boolean)
    : typeof values === "string"
      ? values
          .split(/[|;,]/)
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

  if (required && rawArr.length === 0) {
    errors.push(`${fieldLabel} must have at least one value.`);
    return [];
  }

  const normalized: string[] = [];
  const invalid: string[] = [];

  for (const item of rawArr) {
    const canonical = lookup.get(item.toLowerCase());
    if (!canonical) {
      invalid.push(item);
    } else if (!normalized.includes(canonical)) {
      normalized.push(canonical);
    }
  }

  if (invalid.length > 0) {
    errors.push(
      `Invalid ${fieldLabel}: ${invalid.join(", ")}. Allowed values: ${Array.from(
        new Set(lookup.values())
      ).join(", ")}.`
    );
  }

  return normalized;
}

export function validateCreatorInput(raw: Record<string, unknown>): {
  data?: CreatorMutationInput;
  errors: string[];
} {
  const errors: string[] = [];

  const name = String(raw.name ?? "").trim();
  if (name.length < 2) {
    errors.push("Creator name must be at least 2 characters.");
  }

  const rawPlatform = String(raw.platform ?? "").trim().toLowerCase();
  const platform = PLATFORM_MAP.get(rawPlatform) as Platform | undefined;
  if (!platform) {
    errors.push("Platform must be either 'youtube' or 'instagram'.");
  }

  const profileLink = String(raw.profileLink ?? raw.profile_link ?? "").trim();
  if (!isValidHttpUrl(profileLink)) {
    errors.push("Profile link must be a valid http(s) URL.");
  }

  const rawFollowers = String(
    raw.followersRange ?? raw.followers_range ?? ""
  )
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");
  const followersRange = FOLLOWERS_MAP.get(rawFollowers.toLowerCase());
  if (!followersRange) {
    errors.push(
      `Followers range must be one of: ${FOLLOWERS_RANGE_OPTIONS.join(", ")}.`
    );
  }

  const rawRegion = String(raw.region ?? DEFAULT_REGION).trim() || DEFAULT_REGION;
  const region = REGION_MAP.get(rawRegion.toLowerCase());
  if (!region) {
    errors.push(
      `Region must be one of: ${REGIONS.map((r) => r.name).join(", ")}.`
    );
  }

  const placesCovered = normalizeCanonicalList(
    raw.placesCovered ?? raw.places_covered,
    PLACE_MAP,
    "places_covered",
    errors,
    true
  );

  const travelStyle = normalizeCanonicalList(
    raw.travelStyle ?? raw.travel_style,
    STYLE_MAP,
    "travel_style",
    errors,
    true
  );

  const language = normalizeCanonicalList(
    raw.language ?? raw.languages,
    LANGUAGE_MAP,
    "language",
    errors,
    true
  );

  const budgetMinPerDay = Number(
    raw.budgetMinPerDay ?? raw.budget_min_per_day
  );
  const budgetMaxPerDay = Number(
    raw.budgetMaxPerDay ?? raw.budget_max_per_day
  );
  if (!Number.isFinite(budgetMinPerDay) || budgetMinPerDay < 0) {
    errors.push("Minimum daily budget must be a valid non-negative number.");
  }
  if (
    !Number.isFinite(budgetMaxPerDay) ||
    budgetMaxPerDay < budgetMinPerDay
  ) {
    errors.push("Maximum daily budget must be >= minimum daily budget.");
  }

  const minDays = Number(raw.minDays ?? raw.min_days);
  const maxDays = Number(raw.maxDays ?? raw.max_days);
  if (!Number.isInteger(minDays) || minDays < 1) {
    errors.push("Minimum days must be a whole number >= 1.");
  }
  if (!Number.isInteger(maxDays) || maxDays < minDays) {
    errors.push("Maximum days must be a whole number >= minimum days.");
  }

  const bestKnownFor = String(
    raw.bestKnownFor ?? raw.best_known_for ?? ""
  ).trim();

  const rawSeason = String(raw.bestSeason ?? raw.best_season ?? "")
    .trim()
    .replace(/[–—]/g, "-");
  let bestSeason = "";
  if (rawSeason) {
    const matchedSeason = SEASON_MAP.get(rawSeason.toLowerCase());
    if (!matchedSeason) {
      errors.push(
        `Best season must be one of: ${BEST_SEASON_OPTIONS.join(", ")}.`
      );
    } else {
      bestSeason = matchedSeason;
    }
  } else {
    bestSeason = BEST_SEASON_OPTIONS[0];
  }

  const contact = String(raw.contact ?? "").trim();

  const rawVerified = raw.verified;
  const verified =
    typeof rawVerified === "boolean"
      ? rawVerified
      : ["true", "1", "yes", "y"].includes(
          String(rawVerified ?? "").trim().toLowerCase()
        );

  const rawLastChecked = String(
    raw.lastChecked ?? raw.last_checked ?? ""
  ).trim();
  const todayIso = new Date().toISOString().slice(0, 10);
  const lastChecked = rawLastChecked || todayIso;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastChecked)) {
    errors.push("Last checked date must use YYYY-MM-DD format.");
  }

  if (errors.length > 0 || !platform || !followersRange || !region) {
    return { errors };
  }

  return {
    errors: [],
    data: {
      name,
      platform,
      profileLink,
      followersRange,
      region,
      placesCovered,
      travelStyle,
      budgetMinPerDay: Math.round(budgetMinPerDay),
      budgetMaxPerDay: Math.round(budgetMaxPerDay),
      minDays,
      maxDays,
      language,
      bestKnownFor,
      bestSeason,
      contact,
      verified,
      lastChecked,
    },
  };
}

export function validateVideoInput(
  raw: Record<string, unknown>,
  options: { requireCreatorId?: boolean } = { requireCreatorId: true }
): {
  data?: VideoMutationInput;
  errors: string[];
} {
  const errors: string[] = [];

  const creatorId = String(raw.creatorId ?? raw.creator_id ?? "").trim();
  if (options.requireCreatorId && !creatorId) {
    errors.push("Creator ID is required.");
  }

  const url = String(raw.url ?? "").trim();
  const parsedEmbed = parseOfficialEmbed(url);
  if (!parsedEmbed) {
    errors.push(
      "Video URL must be a valid official YouTube (watch, youtu.be, shorts) or Instagram (/reel/, /p/) link."
    );
  }

  const rawPlatform = String(raw.platform ?? parsedEmbed?.platform ?? "")
    .trim()
    .toLowerCase();
  const platform = PLATFORM_MAP.get(rawPlatform) as Platform | undefined;
  if (!platform) {
    errors.push("Platform must be either 'youtube' or 'instagram'.");
  } else if (parsedEmbed && parsedEmbed.platform !== platform) {
    errors.push(
      `Video URL belongs to ${parsedEmbed.platform}, which does not match selected platform '${platform}'.`
    );
  }

  const title = String(raw.title ?? "").trim();
  if (title.length < 3) {
    errors.push("Video title must be at least 3 characters.");
  }

  const description = String(raw.description ?? "").trim();

  const places = normalizeCanonicalList(
    raw.places,
    PLACE_MAP,
    "places",
    errors,
    false
  );

  if (errors.length > 0 || !platform) {
    return { errors };
  }

  return {
    errors: [],
    data: {
      creatorId,
      url,
      platform,
      title,
      description,
      places,
    },
  };
}
