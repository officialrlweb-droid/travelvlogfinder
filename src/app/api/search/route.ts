import { NextRequest, NextResponse } from "next/server";
import type { Platform } from "@/lib/constants/taxonomy";
import { searchCreators } from "@/lib/search/query";

export const dynamic = "force-dynamic";

function parseListParam(searchParams: URLSearchParams, key: string): string[] {
  const repeated = searchParams.getAll(key);
  return repeated
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const region = sp.get("region") || undefined;
    const place = sp.get("place") || undefined;
    const places = parseListParam(sp, "places");

    const rawDays = sp.get("days");
    const days = rawDays ? Number(rawDays) : undefined;
    if (rawDays && (!Number.isFinite(days) || (days ?? 0) < 1 || (days ?? 0) > 60)) {
      return NextResponse.json(
        { error: "Days must be a number between 1 and 60." },
        { status: 400 }
      );
    }

    const rawBudget = sp.get("totalBudget") ?? sp.get("budget");
    const totalBudget = rawBudget ? Number(rawBudget) : undefined;
    if (
      rawBudget &&
      (!Number.isFinite(totalBudget) || (totalBudget ?? 0) <= 0 || (totalBudget ?? 0) > 10_000_000)
    ) {
      return NextResponse.json(
        { error: "Total budget must be a valid positive INR amount." },
        { status: 400 }
      );
    }

    const rawTravelers = sp.get("travelers");
    const travelers = rawTravelers ? Number(rawTravelers) : 1;
    if (
      rawTravelers &&
      (!Number.isFinite(travelers) || travelers < 1 || travelers > 20)
    ) {
      return NextResponse.json(
        { error: "Travelers must be between 1 and 20." },
        { status: 400 }
      );
    }

    const rawPlatform = sp.get("platform")?.toLowerCase();
    const platform: Platform | undefined =
      rawPlatform === "instagram" || rawPlatform === "youtube"
        ? rawPlatform
        : undefined;

    const styles = parseListParam(sp, "styles");
    const languages = parseListParam(sp, "languages");
    const q = sp.get("q") || undefined;

    const result = await searchCreators({
      region,
      place,
      places,
      days,
      totalBudget,
      travelers,
      styles,
      languages,
      platform,
      q,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/search] Error:", error);
    return NextResponse.json(
      { error: "Failed to search creators. Please try again." },
      { status: 500 }
    );
  }
}
