import type { Platform } from "@/lib/constants/taxonomy";
import type { SpendBreakdown } from "./budget";

export type BudgetFit = "within" | "slightly_over";
export type BudgetMatchLevel = "exact" | "overlap" | "under";

export interface SearchFilters {
  region?: string;
  place?: string;
  places?: string[];
  days?: number;
  totalBudget?: number;
  travelers?: number;
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
  matchedPlaces: string[];
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

export interface RouteComboStop {
  place: string;
  creator: {
    id: string;
    name: string;
    platform: Platform;
    followersRange: string;
    budgetMinPerDay: number;
    budgetMaxPerDay: number;
    verified: boolean;
    budgetFit: BudgetFit | null;
  } | null;
}

export interface RouteWatchlistCombo {
  stops: RouteComboStop[];
  allStopsCoveredBySingleCreator: boolean;
  uniqueCreatorIds: string[];
}

export interface SearchResponse {
  tripSummary: {
    region: string;
    place: string | null;
    places: string[];
    days: number | null;
    totalBudget: number | null;
    travelers: number;
    perDayBudget: number | null;
    headerText: string | null;
    budgetNote: string;
    spendBreakdown: SpendBreakdown | null;
    routeCombo: RouteWatchlistCombo | null;
  };
  totalCount: number;
  creators: CreatorSearchResult[];
}
