import type { Platform } from "@/lib/constants/taxonomy";
import type { DbClient } from "@/lib/db/client";
import { ensureDatabaseReady } from "@/lib/db/init";
import type { FeaturedVideo } from "./types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SimilarCreatorSummary {
  id: string;
  name: string;
  platform: Platform;
  followersRange: string;
  placesCovered: string[];
  budgetMinPerDay: number;
  budgetMaxPerDay: number;
  verified: boolean;
}

export interface CreatorProfileDetail {
  id: string;
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
  verified: boolean;
  lastChecked: string;
  videos: FeaturedVideo[];
  similarCreators: SimilarCreatorSummary[];
}

interface CreatorRow {
  id: string;
  name: string;
  platform: Platform;
  profile_link: string;
  followers_range: string;
  region: string;
  places_covered: string[];
  travel_style: string[];
  budget_min_per_day: number;
  budget_max_per_day: number;
  min_days: number;
  max_days: number;
  language: string[];
  best_known_for: string;
  best_season: string;
  verified: boolean;
  last_checked: string | Date;
}

interface VideoRow {
  id: string;
  creator_id: string;
  url: string;
  platform: Platform;
  title: string;
  description: string;
  places: string[];
  created_at: string | Date;
}

interface SimilarRow {
  id: string;
  name: string;
  platform: Platform;
  followers_range: string;
  places_covered: string[];
  budget_min_per_day: number;
  budget_max_per_day: number;
  verified: boolean;
}

export async function getCreatorProfileById(
  id: string,
  dbOverride?: DbClient
): Promise<CreatorProfileDetail | null> {
  if (!UUID_REGEX.test(id)) {
    return null;
  }

  const db = dbOverride ?? (await ensureDatabaseReady());

  const creatorRes = await db.query<CreatorRow>(
    `
    SELECT
      id,
      name,
      platform,
      profile_link,
      followers_range,
      region,
      places_covered,
      travel_style,
      budget_min_per_day,
      budget_max_per_day,
      min_days,
      max_days,
      language,
      best_known_for,
      best_season,
      verified,
      last_checked
    FROM creators
    WHERE id = $1
    `,
    [id]
  );

  if (creatorRes.rows.length === 0) {
    return null;
  }

  const row = creatorRes.rows[0];

  const [videosRes, similarRes] = await Promise.all([
    db.query<VideoRow>(
      `
      SELECT id, creator_id, url, platform, title, description, places, created_at
      FROM videos
      WHERE creator_id = $1
      ORDER BY created_at DESC, title ASC
      `,
      [id]
    ),
    db.query<SimilarRow>(
      `
      SELECT
        id,
        name,
        platform,
        followers_range,
        places_covered,
        budget_min_per_day,
        budget_max_per_day,
        verified
      FROM creators
      WHERE id <> $1
        AND region = $2
        AND places_covered && $3::text[]
      ORDER BY
        verified DESC,
        ABS(budget_min_per_day - $4) ASC,
        name ASC
      LIMIT 4
      `,
      [id, row.region, row.places_covered ?? [], row.budget_min_per_day]
    ),
  ]);

  const videos: FeaturedVideo[] = videosRes.rows.map((v) => ({
    id: v.id,
    creatorId: v.creator_id,
    url: v.url,
    platform: v.platform,
    title: v.title,
    description: v.description,
    places: v.places ?? [],
    createdAt:
      v.created_at instanceof Date
        ? v.created_at.toISOString()
        : String(v.created_at),
  }));

  const similarCreators: SimilarCreatorSummary[] = similarRes.rows.map((s) => ({
    id: s.id,
    name: s.name,
    platform: s.platform,
    followersRange: s.followers_range,
    placesCovered: s.places_covered ?? [],
    budgetMinPerDay: s.budget_min_per_day,
    budgetMaxPerDay: s.budget_max_per_day,
    verified: s.verified,
  }));

  const lastChecked =
    row.last_checked instanceof Date
      ? row.last_checked.toISOString().slice(0, 10)
      : String(row.last_checked).slice(0, 10);

  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    profileLink: row.profile_link,
    followersRange: row.followers_range,
    region: row.region,
    placesCovered: row.places_covered ?? [],
    travelStyle: row.travel_style ?? [],
    budgetMinPerDay: row.budget_min_per_day,
    budgetMaxPerDay: row.budget_max_per_day,
    minDays: row.min_days,
    maxDays: row.max_days,
    language: row.language ?? [],
    bestKnownFor: row.best_known_for,
    bestSeason: row.best_season,
    verified: row.verified,
    lastChecked,
    videos,
    similarCreators,
  };
}
