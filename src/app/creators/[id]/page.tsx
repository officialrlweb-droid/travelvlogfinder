import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreatorProfileView } from "@/components/CreatorProfileView";
import { getCreatorProfileById } from "@/lib/search/profile";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function parsePositiveNum(val: string | string[] | undefined): number | null {
  const raw = Array.isArray(val) ? val[0] : val;
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const creator = await getCreatorProfileById(id);
  if (!creator) {
    return {
      title: "Creator not found — TravelVlogFinder",
    };
  }

  return {
    title: `${creator.name} — Kerala Travel Creator | TravelVlogFinder`,
    description: `${creator.placesCovered.join(", ")} · Rs ${creator.budgetMinPerDay.toLocaleString(
      "en-IN"
    )} to ${creator.budgetMaxPerDay.toLocaleString("en-IN")}/day · ${
      creator.bestKnownFor
    }`,
  };
}

export default async function CreatorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const creator = await getCreatorProfileById(id);

  if (!creator) {
    notFound();
  }

  const initialDays = parsePositiveNum(sp.days);
  const initialBudget = parsePositiveNum(sp.budget);

  return (
    <CreatorProfileView
      creator={creator}
      initialDays={initialDays}
      initialBudget={initialBudget}
    />
  );
}
