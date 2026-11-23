export type Platform = "instagram" | "youtube";

export interface PlaceOption {
  name: string;
  district: string;
  region: string;
  highlights: string;
  featured?: boolean;
}

export interface RegionGroup {
  name: string;
  country: string;
  places: PlaceOption[];
}

export const REGIONS: RegionGroup[] = [
  {
    name: "Kerala, India",
    country: "India",
    places: [
      {
        name: "Wayanad",
        district: "Wayanad",
        region: "Kerala, India",
        highlights: "Lakkidi, Banasura Dam, Edakkal Caves, Chembra Peak, 900 Kandi",
        featured: true,
      },
      {
        name: "Munnar",
        district: "Idukki",
        region: "Kerala, India",
        highlights: "Tea Plantations, Kolukkumalai, Eravikulam, Top Station",
        featured: true,
      },
      {
        name: "Varkala",
        district: "Thiruvananthapuram",
        region: "Kerala, India",
        highlights: "Varkala Cliff, Papanasam Beach, Black Sand Beach, Cliff Cafes",
        featured: true,
      },
      {
        name: "Kochi",
        district: "Ernakulam",
        region: "Kerala, India",
        highlights: "Fort Kochi, Mattancherry, Jew Town, Kadamakkudy",
        featured: true,
      },
      {
        name: "Alleppey",
        district: "Alappuzha",
        region: "Kerala, India",
        highlights: "Backwaters, Houseboats, Shikara Rides, Marari Beach",
      },
      {
        name: "Thekkady",
        district: "Idukki",
        region: "Kerala, India",
        highlights: "Periyar Wildlife Sanctuary, Spice Gardens, Bamboo Rafting",
      },
      {
        name: "Vagamon",
        district: "Idukki",
        region: "Kerala, India",
        highlights: "Pine Forests, Rolling Meadows, Paragliding",
      },
      {
        name: "Kozhikode",
        district: "Kozhikode",
        region: "Kerala, India",
        highlights: "Malabar Cuisine, Beypore, Kappad Beach, SM Street",
      },
      {
        name: "Kannur",
        district: "Kannur",
        region: "Kerala, India",
        highlights: "Theyyam, Muzhappilangad Drive-in Beach, St Angelo Fort",
      },
      {
        name: "Thrissur",
        district: "Thrissur",
        region: "Kerala, India",
        highlights: "Athirappilly Waterfalls, Cultural Heritage, Temples",
      },
      {
        name: "Kovalam",
        district: "Thiruvananthapuram",
        region: "Kerala, India",
        highlights: "Lighthouse Beach, Poovar Estuary, Coastal Stays",
      },
      {
        name: "Munroe Island",
        district: "Kollam",
        region: "Kerala, India",
        highlights: "Sunrise Mangrove Canoes, Ashtamudi Backwaters",
      },
    ],
  },
];

export const DEFAULT_REGION = "Kerala, India";

export const ALL_PLACES: PlaceOption[] = REGIONS.flatMap((r) => r.places);

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
];

export const TRAVEL_STYLE_OPTIONS = [
  "Budget & Backpacking",
  "Mid-Range Comfort",
  "Luxury & Resorts",
  "Solo Travel",
  "Couple & Honeymoon",
  "Family Friendly",
  "Adventure & Trekking",
  "Food & Culture",
  "Road Trip & Bike",
  "Slow Travel & Cafes",
] as const;

export type TravelStyle = (typeof TRAVEL_STYLE_OPTIONS)[number];

export const LANGUAGE_OPTIONS = [
  "Malayalam",
  "English",
  "Hindi",
  "Tamil",
  "Kannada",
  "Telugu",
] as const;

export type CreatorLanguage = (typeof LANGUAGE_OPTIONS)[number];

export const FOLLOWERS_RANGE_OPTIONS = [
  "Under 10K",
  "10K - 50K",
  "50K - 100K",
  "100K - 500K",
  "500K - 1M",
  "1M+",
] as const;

export const BEST_SEASON_OPTIONS = [
  "Oct - Feb (Winter & Peak)",
  "Jun - Sep (Monsoon)",
  "Mar - May (Summer Hills)",
  "Year-round",
] as const;

export const BUDGET_DISCLAIMER_NOTE =
  "Budget covers stay, food and local travel. Does not include travel to the destination.";
