import type { Platform } from "@/lib/constants/taxonomy";

export type BudgetFit = "within" | "slightly_over";
export type BudgetMatchLevel = "exact" | "overlap" | "under";

export interface SearchFilters {
  region?: string;
  place?: string;
  days?: number;
  totalBudget?: number;
  styles?: string[];
  languages?: string[];
  platform?: Platform;
  q?: string;
}

export interface FeaturedVideo {
  id: string;
  creatorId: string;
  url: string;
  platform: Platform;
  title: string;
  description: string;
  places: string[];
  createdAt: string;
}

export interface CreatorSearchResult {
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
  budgetFit: BudgetFit | null;
  budgetMatchLevel: BudgetMatchLevel | null;
  estimatedTotalMin: number | null;
  estimatedTotalMax: number | null;
  featuredVideos: FeaturedVideo[];
}

export interface SearchResponse {
  tripSummary: {
    region: string;
    place: string | null;
    days: number | null;
    totalBudget: number | null;
    perDayBudget: number | null;
    headerText: string | null;
    budgetNote: string;
  };
  totalCount: number;
  creators: CreatorSearchResult[];
}
