import { SearchExplorer } from "@/components/SearchExplorer";
import { DEFAULT_REGION, type Platform } from "@/lib/constants/taxonomy";
import { searchCreators } from "@/lib/search/query";
import type { SearchFilters } from "@/lib/search/types";

export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstString(val: string | string[] | undefined): string | undefined {
  if (typeof val === "string") return val.trim() || undefined;
  if (Array.isArray(val)) return val[0]?.trim() || undefined;
  return undefined;
}

function parseList(val: string | string[] | undefined): string[] {
  const arr = typeof val === "string" ? [val] : Array.isArray(val) ? val : [];
  return arr
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const hasAnyParam = Object.keys(sp).length > 0;

  let initialFilters: SearchFilters;
  if (!hasAnyParam) {
    // Default landing view: Wayanad · 2 days · Rs 5,000 (Rs 2,500/day)
    initialFilters = {
      region: DEFAULT_REGION,
      places: ["Wayanad"],
      days: 2,
      totalBudget: 5000,
      travelers: 1,
    };
  } else {
    const rawDays = firstString(sp.days);
    const parsedDays = rawDays ? Number(rawDays) : undefined;
    const rawBudget = firstString(sp.budget) ?? firstString(sp.totalBudget);
    const parsedBudget = rawBudget ? Number(rawBudget) : undefined;
    const rawTravelers = firstString(sp.travelers);
    const parsedTravelers = rawTravelers ? Number(rawTravelers) : 1;
    const rawPlatform = firstString(sp.platform)?.toLowerCase();
    const platform: Platform | undefined =
      rawPlatform === "youtube" || rawPlatform === "instagram"
        ? rawPlatform
        : undefined;

    const multiPlaces = parseList(sp.places);
    const singlePlace = firstString(sp.place);
    const places =
      multiPlaces.length > 0
        ? multiPlaces.slice(0, 3)
        : singlePlace
          ? [singlePlace]
          : [];

    initialFilters = {
      region: firstString(sp.region) || DEFAULT_REGION,
      places,
      days:
        parsedDays && Number.isFinite(parsedDays) && parsedDays >= 1
          ? Math.floor(parsedDays)
          : undefined,
      totalBudget:
        parsedBudget && Number.isFinite(parsedBudget) && parsedBudget > 0
          ? Math.round(parsedBudget)
          : undefined,
      travelers:
        parsedTravelers &&
        Number.isFinite(parsedTravelers) &&
        parsedTravelers >= 1
          ? Math.min(20, Math.floor(parsedTravelers))
          : 1,
      styles: parseList(sp.styles),
      languages: parseList(sp.languages),
      platform,
      q: firstString(sp.q),
    };
  }

  const initialData = await searchCreators(initialFilters);

  return (
    <SearchExplorer
      initialData={initialData}
      initialFilters={initialFilters}
    />
  );
}
