import {
  BUDGET_DISCLAIMER_NOTE,
  DEFAULT_REGION,
  type Platform,
} from "@/lib/constants/taxonomy";
import type { DbClient } from "@/lib/db/client";
import { ensureDatabaseReady } from "@/lib/db/init";
import type {
  BudgetFit,
  BudgetMatchLevel,
  CreatorSearchResult,
  FeaturedVideo,
  SearchFilters,
  SearchResponse,
} from "./types";

interface CreatorDbRow {
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
  budget_fit_tier: number | null;
}

interface VideoDbRow {
  id: string;
  creator_id: string;
  url: string;
  platform: Platform;
  title: string;
  description: string;
  places: string[];
  created_at: string | Date;
}

export function formatInrNumber(value: number): string {
  return Math.round(value).toLocaleString("en-IN");
}

export function calculatePerDayBudget(
  totalBudget?: number,
  days?: number
): number | null {
  if (
    typeof totalBudget !== "number" ||
    !Number.isFinite(totalBudget) ||
    totalBudget <= 0 ||
    typeof days !== "number" ||
    !Number.isFinite(days) ||
    days < 1
  ) {
    return null;
  }
  return totalBudget / days;
}

export const EXACT_FULL_FIT_FLOOR_RATIO = 0.85;

export function classifyBudgetFit(
  budgetMinPerDay: number,
  budgetMaxPerDay: number,
  perDayBudget: number
): BudgetFit | null {
  if (budgetMinPerDay > perDayBudget) {
    return null;
  }
  return budgetMaxPerDay <= perDayBudget ? "within" : "slightly_over";
}

export function classifyBudgetMatchLevel(
  budgetMinPerDay: number,
  budgetMaxPerDay: number,
  perDayBudget: number
): BudgetMatchLevel | null {
  if (budgetMinPerDay > perDayBudget) {
    return null;
  }
  if (budgetMaxPerDay <= perDayBudget) {
    return budgetMaxPerDay >= perDayBudget * EXACT_FULL_FIT_FLOOR_RATIO
      ? "exact"
      : "under";
  }
  return "overlap";
}

export function formatTripHeader(
  days: number | null,
  perDayBudget: number | null
): string | null {
  if (!days || !perDayBudget) {
    return null;
  }
  const dayLabel = days === 1 ? "day" : "days";
  return `Your trip: ${days} ${dayLabel} x Rs ${formatInrNumber(perDayBudget)}/day`;
}

/**
 * Builds a safe prefix tsquery string (e.g. "wayanad cafe" -> "wayanad:* & cafe:*")
 * so partial keyword typing works alongside Postgres websearch_to_tsquery.
 */
function buildPrefixTsQueryString(raw: string): string | null {
  const tokens = raw
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) {
    return null;
  }
  return tokens.map((t) => `${t}:*`).join(" & ");
}

export async function searchCreators(
  filters: SearchFilters,
  dbOverride?: DbClient
): Promise<SearchResponse> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const region = filters.region?.trim() || DEFAULT_REGION;
  const place = filters.place?.trim() || null;
  const days =
    typeof filters.days === "number" && Number.isFinite(filters.days) && filters.days >= 1
      ? Math.floor(filters.days)
      : null;
  const totalBudget =
    typeof filters.totalBudget === "number" &&
    Number.isFinite(filters.totalBudget) &&
    filters.totalBudget > 0
      ? Math.round(filters.totalBudget)
      : null;
  const perDayBudget = calculatePerDayBudget(totalBudget ?? undefined, days ?? undefined);
  const styles = (filters.styles ?? []).map((s) => s.trim()).filter(Boolean);
  const languages = (filters.languages ?? []).map((l) => l.trim()).filter(Boolean);
  const platform =
    filters.platform === "instagram" || filters.platform === "youtube"
      ? filters.platform
      : null;
  const keyword = filters.q?.trim() || null;
  const prefixTsQuery = keyword ? buildPrefixTsQueryString(keyword) : null;

  const params: unknown[] = [];
  const addParam = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  const whereClauses: string[] = [];

  // Region filter
  const regionParam = addParam(region);
  whereClauses.push(`c.region = ${regionParam}`);

  // Specific place/district filter using GIN index on places_covered
  if (place) {
    const placeParam = addParam([place]);
    whereClauses.push(`c.places_covered @> ${placeParam}::text[]`);
  }

  // Selected days must fall within creator's [min_days, max_days]
  if (days !== null) {
    const daysParam = addParam(days);
    whereClauses.push(
      `c.min_days <= ${daysParam} AND c.max_days >= ${daysParam}`
    );
  }

  // Budget eligibility + Exact-Match-First ranking:
  // Eligible if creator's minimum daily budget is affordable (budget_min_per_day <= perDayBudget).
  // Ranked by closeness to the traveler's per-day budget:
  // - Tier 0 ("exact"): Full range fits inside budget AND max is within 85%-100% of perDayBudget
  //   (sorted by smallest gap to perDayBudget first, so budget_max_per_day == perDayBudget is #1)
  // - Tier 1 ("overlap"): Creator's [min, max] directly contains perDayBudget (min <= B < max),
  //   sorted by smallest overage (budget_max_per_day - B) ASC
  // - Tier 2 ("under"): Lower-budget full fits (budget_max_per_day < 85% of B),
  //   sorted closest-to-budget first (B - budget_max_per_day) ASC
  let budgetFitTierExpr = "NULL::integer";
  let budgetOrderExpr = "";
  if (perDayBudget !== null) {
    const perDayParam = addParam(perDayBudget);
    const exactFloorParam = addParam(
      Math.round(perDayBudget * EXACT_FULL_FIT_FLOOR_RATIO)
    );
    whereClauses.push(`c.budget_min_per_day <= ${perDayParam}`);
    budgetFitTierExpr = `
      CASE
        WHEN c.budget_max_per_day <= ${perDayParam} AND c.budget_max_per_day >= ${exactFloorParam} THEN 0
        WHEN c.budget_max_per_day > ${perDayParam} THEN 1
        ELSE 2
      END
    `;
    budgetOrderExpr = `
      budget_fit_tier ASC,
      CASE
        WHEN c.budget_max_per_day <= ${perDayParam} THEN (${perDayParam} - c.budget_max_per_day)
        ELSE (c.budget_max_per_day - ${perDayParam})
      END ASC,
      ABS(((c.budget_min_per_day + c.budget_max_per_day) / 2.0) - ${perDayParam}) ASC
    `;
  }

  // Optional filters: travel style (multi-select), language (multi-select), platform
  if (styles.length > 0) {
    const stylesParam = addParam(styles);
    whereClauses.push(`c.travel_style && ${stylesParam}::text[]`);
  }

  if (languages.length > 0) {
    const langsParam = addParam(languages);
    whereClauses.push(`c.language && ${langsParam}::text[]`);
  }

  if (platform) {
    const platformParam = addParam(platform);
    whereClauses.push(`c.platform = ${platformParam}`);
  }

  // Postgres full-text search across creator name, places_covered, best_known_for,
  // and videos.title / videos.description
  let ftsRankExpr = "0::real";
  if (keyword) {
    const rawQParam = addParam(keyword);
    const tsQueryParts = [`websearch_to_tsquery('english', ${rawQParam})`];
    if (prefixTsQuery) {
      const prefixParam = addParam(prefixTsQuery);
      tsQueryParts.push(`to_tsquery('english', ${prefixParam})`);
    }
    const combinedTsQuery =
      tsQueryParts.length === 2
        ? `(${tsQueryParts[0]} || ${tsQueryParts[1]})`
        : tsQueryParts[0];

    whereClauses.push(`
      (
        c.search_vector @@ ${combinedTsQuery}
        OR EXISTS (
          SELECT 1
          FROM videos v
          WHERE v.creator_id = c.id
            AND v.search_vector @@ ${combinedTsQuery}
        )
      )
    `);

    ftsRankExpr = `
      (
        ts_rank_cd(c.search_vector, ${combinedTsQuery}) +
        COALESCE(
          (
            SELECT MAX(ts_rank_cd(v.search_vector, ${combinedTsQuery}))
            FROM videos v
            WHERE v.creator_id = c.id
              AND v.search_vector @@ ${combinedTsQuery}
          ),
          0
        )
      )
    `;
  }

  const orderByParts: string[] = [];
  if (budgetOrderExpr) {
    orderByParts.push(budgetOrderExpr);
  }
  if (keyword) {
    orderByParts.push("fts_rank DESC");
  }
  orderByParts.push("c.verified DESC", "c.budget_min_per_day ASC", "c.name ASC");

  const sql = `
    SELECT
      c.id,
      c.name,
      c.platform,
      c.profile_link,
      c.followers_range,
      c.region,
      c.places_covered,
      c.travel_style,
      c.budget_min_per_day,
      c.budget_max_per_day,
      c.min_days,
      c.max_days,
      c.language,
      c.best_known_for,
      c.best_season,
      c.verified,
      c.last_checked,
      ${budgetFitTierExpr} AS budget_fit_tier,
      ${ftsRankExpr} AS fts_rank
    FROM creators c
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY ${orderByParts.join(", ")}
  `;

  const creatorsRes = await db.query<CreatorDbRow>(sql, params);
  const creatorIds = creatorsRes.rows.map((r) => r.id);

  const videosByCreator = new Map<string, FeaturedVideo[]>();
  if (creatorIds.length > 0) {
    const videoParams: unknown[] = [creatorIds];
    let placeMatchExpr = "0";
    if (place) {
      videoParams.push([place]);
      placeMatchExpr = `CASE WHEN v.places @> $2::text[] THEN 1 ELSE 0 END`;
    }

    const videosRes = await db.query<VideoDbRow>(
      `
      SELECT
        id,
        creator_id,
        url,
        platform,
        title,
        description,
        places,
        created_at
      FROM (
        SELECT
          v.*,
          ${placeMatchExpr} AS is_place_match,
          MAX(${placeMatchExpr}) OVER (PARTITION BY v.creator_id) AS has_place_match,
          ROW_NUMBER() OVER (
            PARTITION BY v.creator_id
            ORDER BY ${placeMatchExpr} DESC, v.created_at DESC, v.title ASC
          ) AS rn
        FROM videos v
        WHERE v.creator_id = ANY($1::uuid[])
      ) ranked
      WHERE rn <= 3
        AND (has_place_match = 0 OR is_place_match = 1)
      ORDER BY creator_id, rn ASC
      `,
      videoParams
    );

    for (const row of videosRes.rows) {
      const list = videosByCreator.get(row.creator_id) ?? [];
      list.push({
        id: row.id,
        creatorId: row.creator_id,
        url: row.url,
        platform: row.platform,
        title: row.title,
        description: row.description,
        places: row.places ?? [],
        createdAt:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at),
      });
      videosByCreator.set(row.creator_id, list);
    }
  }

  const creators: CreatorSearchResult[] = creatorsRes.rows.map((row) => {
    const budgetFit: BudgetFit | null =
      perDayBudget !== null
        ? classifyBudgetFit(
            row.budget_min_per_day,
            row.budget_max_per_day,
            perDayBudget
          )
        : null;

    const budgetMatchLevel: BudgetMatchLevel | null =
      perDayBudget !== null
        ? classifyBudgetMatchLevel(
            row.budget_min_per_day,
            row.budget_max_per_day,
            perDayBudget
          )
        : null;

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
      budgetFit,
      budgetMatchLevel,
      estimatedTotalMin: days !== null ? row.budget_min_per_day * days : null,
      estimatedTotalMax: days !== null ? row.budget_max_per_day * days : null,
      featuredVideos: videosByCreator.get(row.id) ?? [],
    };
  });

  return {
    tripSummary: {
      region,
      place,
      days,
      totalBudget,
      perDayBudget: perDayBudget !== null ? Math.round(perDayBudget) : null,
      headerText: formatTripHeader(days, perDayBudget),
      budgetNote: BUDGET_DISCLAIMER_NOTE,
    },
    totalCount: creators.length,
    creators,
  };
}
