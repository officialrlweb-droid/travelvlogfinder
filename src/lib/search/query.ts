import {
  BUDGET_DISCLAIMER_NOTE,
  DEFAULT_REGION,
  type Platform,
} from "@/lib/constants/taxonomy";
import type { DbClient } from "@/lib/db/client";
import { ensureDatabaseReady } from "@/lib/db/init";
import { calculateSpendBreakdown } from "./budget";
import type {
  BudgetFit,
  BudgetMatchLevel,
  CreatorSearchResult,
  FeaturedVideo,
  RouteComboStop,
  RouteWatchlistCombo,
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
  matched_places_count: number;
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
  perDayBudget: number | null,
  travelers = 1
): string | null {
  if (!days || !perDayBudget) {
    return null;
  }
  const dayLabel = days === 1 ? "day" : "days";
  if (travelers > 1) {
    return `Your trip: ${days} ${dayLabel} x Rs ${formatInrNumber(
      perDayBudget
    )}/person/day (${travelers} travelers)`;
  }
  return `Your trip: ${days} ${dayLabel} x Rs ${formatInrNumber(perDayBudget)}/day`;
}

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

function normalizeSelectedPlaces(filters: SearchFilters): string[] {
  const combined: string[] = [];
  if (Array.isArray(filters.places)) {
    for (const p of filters.places) {
      const trimmed = p.trim();
      if (trimmed && !combined.includes(trimmed)) {
        combined.push(trimmed);
      }
    }
  }
  if (filters.place?.trim() && !combined.includes(filters.place.trim())) {
    combined.push(filters.place.trim());
  }
  return combined.slice(0, 3);
}

function buildRouteCombo(
  selectedPlaces: string[],
  creators: CreatorSearchResult[]
): RouteWatchlistCombo | null {
  if (selectedPlaces.length < 2) {
    return null;
  }

  const allStopsCoveredBySingleCreator = creators.some(
    (c) => c.matchedPlaces.length === selectedPlaces.length
  );

  // Pick the highest-ranked matching creator for each stop (already ordered by exact budget fit)
  const stops: RouteComboStop[] = selectedPlaces.map((stopName) => {
    const best = creators.find((c) =>
      c.placesCovered.some((p) => p.toLowerCase() === stopName.toLowerCase())
    );
    return {
      place: stopName,
      creator: best
        ? {
            id: best.id,
            name: best.name,
            platform: best.platform,
            followersRange: best.followersRange,
            budgetMinPerDay: best.budgetMinPerDay,
            budgetMaxPerDay: best.budgetMaxPerDay,
            verified: best.verified,
            budgetFit: best.budgetFit,
          }
        : null,
    };
  });

  const uniqueCreatorIds = Array.from(
    new Set(stops.map((s) => s.creator?.id).filter((id): id is string => Boolean(id)))
  );

  return {
    stops,
    allStopsCoveredBySingleCreator,
    uniqueCreatorIds,
  };
}

export async function searchCreators(
  filters: SearchFilters,
  dbOverride?: DbClient
): Promise<SearchResponse> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const region = filters.region?.trim() || DEFAULT_REGION;
  const selectedPlaces = normalizeSelectedPlaces(filters);
  const primaryPlace = selectedPlaces.length === 1 ? selectedPlaces[0] : null;
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
  const travelers =
    typeof filters.travelers === "number" &&
    Number.isFinite(filters.travelers) &&
    filters.travelers >= 1
      ? Math.min(20, Math.floor(filters.travelers))
      : 1;
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

  // Single or multi-stop destination filter using GIN index on places_covered
  let matchedPlacesCountExpr = "0::integer";
  if (selectedPlaces.length === 1) {
    const placeParam = addParam(selectedPlaces);
    whereClauses.push(`c.places_covered @> ${placeParam}::text[]`);
    matchedPlacesCountExpr = "1::integer";
  } else if (selectedPlaces.length > 1) {
    const placesParam = addParam(selectedPlaces);
    whereClauses.push(`c.places_covered && ${placesParam}::text[]`);
    matchedPlacesCountExpr = `
      (
        SELECT COUNT(*)::integer
        FROM unnest(c.places_covered) AS p
        WHERE p = ANY(${placesParam}::text[])
      )
    `;
  }

  // Selected days must fall within creator's [min_days, max_days]
  if (days !== null) {
    const daysParam = addParam(days);
    whereClauses.push(
      `c.min_days <= ${daysParam} AND c.max_days >= ${daysParam}`
    );
  }

  // Budget eligibility + Exact-Match-First ranking
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
  if (selectedPlaces.length > 1) {
    // Multi-stop routes rank creators covering more selected stops first
    orderByParts.push("matched_places_count DESC");
  }
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
      ${matchedPlacesCountExpr} AS matched_places_count,
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
    if (selectedPlaces.length > 0) {
      videoParams.push(selectedPlaces);
      placeMatchExpr = `CASE WHEN v.places && $2::text[] THEN 1 ELSE 0 END`;
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

  const selectedLower = new Set(selectedPlaces.map((p) => p.toLowerCase()));

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

    const placesCovered = row.places_covered ?? [];
    const matchedPlaces =
      selectedPlaces.length > 0
        ? placesCovered.filter((p) => selectedLower.has(p.toLowerCase()))
        : [];

    return {
      id: row.id,
      name: row.name,
      platform: row.platform,
      profileLink: row.profile_link,
      followersRange: row.followers_range,
      region: row.region,
      placesCovered,
      matchedPlaces,
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

  const spendBreakdown =
    perDayBudget !== null
      ? calculateSpendBreakdown(perDayBudget, travelers)
      : null;

  const routeCombo = buildRouteCombo(selectedPlaces, creators);

  return {
    tripSummary: {
      region,
      place: primaryPlace,
      places: selectedPlaces,
      days,
      totalBudget,
      travelers,
      perDayBudget: perDayBudget !== null ? Math.round(perDayBudget) : null,
      headerText: formatTripHeader(days, perDayBudget, travelers),
      budgetNote: BUDGET_DISCLAIMER_NOTE,
      spendBreakdown,
      routeCombo,
    },
    totalCount: creators.length,
    creators,
  };
}
