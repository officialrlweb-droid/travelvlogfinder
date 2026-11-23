import type { Platform } from "@/lib/constants/taxonomy";

export interface SeedVideoInput {
  url: string;
  platform: Platform;
  title: string;
  description: string;
  places: string[];
}

export interface SeedCreatorInput {
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
  contact: string;
  verified: boolean;
  last_checked: string;
  videos: SeedVideoInput[];
}

/**
 * 10 sample Kerala creators across Wayanad, Munnar, Varkala, and Kochi
 * covering continuous per-day budget tiers from Rs 1,000/day to Rs 10,000/day.
 * Video links are demo creator-submitted URLs formatted for official YouTube/Instagram embeds.
 */
export const SEED_CREATORS: SeedCreatorInput[] = [
  {
    name: "Malabar Backpacker (Arun Menon)",
    platform: "youtube",
    profile_link: "https://www.youtube.com/@malabarbackpacker-demo",
    followers_range: "50K - 100K",
    region: "Kerala, India",
    places_covered: ["Wayanad", "Kozhikode", "Kannur"],
    travel_style: ["Budget & Backpacking", "Road Trip & Bike", "Adventure & Trekking"],
    budget_min_per_day: 1200,
    budget_max_per_day: 2500,
    min_days: 1,
    max_days: 5,
    language: ["Malayalam", "English"],
    best_known_for:
      "KSRTC bus routes, budget homestays in Kalpetta, scooter rentals, Chembra Peak trek permissions, and authentic Malabar mess food guides.",
    best_season: "Oct - Feb (Winter & Peak)",
    contact: "arun.malabar@example.com",
    verified: true,
    last_checked: "2026-10-18",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO01WY",
        platform: "youtube",
        title: "Wayanad 2 Days Budget Guide Under Rs 5,000 | KSRTC + Homestays",
        description:
          "Complete 2-day Wayanad backpacking plan covering Lakkidi Viewpoint, En Ooru tribal village, Banasura Sagar Dam, Edakkal Caves, and local Malabar parotta spots.",
        places: ["Wayanad"],
      },
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO02WY",
        platform: "youtube",
        title: "900 Kandi Glass Bridge & Soochipara Waterfalls on a Rented Scooter",
        description:
          "Honest jeep-sharing costs, entry ticket prices, and morning timing tips to avoid crowds at 900 Kandi and Soochipara in Wayanad.",
        places: ["Wayanad"],
      },
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO03KZ",
        platform: "youtube",
        title: "Kozhikode to Wayanad Ghat Road Food & Stay Breakdown",
        description:
          "Stop-by-stop food trail from Kozhikode biriyani spots up the Thamarassery Churam hairpin bends into Vythiri hostels.",
        places: ["Kozhikode", "Wayanad"],
      },
    ],
  },
  {
    name: "Kerala on a Shoestring (Sneha Nair)",
    platform: "instagram",
    profile_link: "https://www.instagram.com/keralaonashoestring.demo/",
    followers_range: "10K - 50K",
    region: "Kerala, India",
    places_covered: ["Wayanad", "Munnar", "Kochi"],
    travel_style: ["Solo Travel", "Budget & Backpacking", "Slow Travel & Cafes"],
    budget_min_per_day: 1800,
    budget_max_per_day: 3000,
    min_days: 2,
    max_days: 4,
    language: ["English", "Malayalam"],
    best_known_for:
      "Safe female solo hostels in Vythiri, Munnar dorms with tea-valley views, Fort Kochi ferry tips, and exact daily expense reels.",
    best_season: "Year-round",
    contact: "sneha.shoestring@example.com",
    verified: true,
    last_checked: "2026-11-02",
    videos: [
      {
        url: "https://www.instagram.com/reel/TVFDEMO_SN01/",
        platform: "instagram",
        title: "Solo 2-Day Wayanad Itinerary for Rs 2,500/day",
        description:
          "Hostel stay in Vythiri, shared autos to Pookode Lake and Banasura Dam, plus cozy coffee estate cafes.",
        places: ["Wayanad"],
      },
      {
        url: "https://www.instagram.com/reel/TVFDEMO_SN02/",
        platform: "instagram",
        title: "Munnar in 3 Days Without a Private Cab",
        description:
          "How to cover Eravikulam National Park, Mattupetty, and tea museum using local buses and shared jeeps.",
        places: ["Munnar"],
      },
      {
        url: "https://www.instagram.com/reel/TVFDEMO_SN03/",
        platform: "instagram",
        title: "Fort Kochi Solo Walking Loop & Water Metro",
        description:
          "Rs 40 Kochi Water Metro ride, Jew Town spice lanes, heritage art cafes, and sunset by the Chinese fishing nets.",
        places: ["Kochi"],
      },
    ],
  },
  {
    name: "Ghats & Mist (Rohan & Diya)",
    platform: "youtube",
    profile_link: "https://www.youtube.com/@ghatsandmist-demo",
    followers_range: "100K - 500K",
    region: "Kerala, India",
    places_covered: ["Wayanad", "Munnar", "Vagamon"],
    travel_style: ["Couple & Honeymoon", "Mid-Range Comfort", "Road Trip & Bike"],
    budget_min_per_day: 2500,
    budget_max_per_day: 5000,
    min_days: 1,
    max_days: 6,
    language: ["English", "Hindi"],
    best_known_for:
      "Boutique plantation stays, misty hill drives, Kolukkumalai sunrise jeeps, and relaxed couple itineraries in the Western Ghats.",
    best_season: "Oct - Feb (Winter & Peak)",
    contact: "rohandiya.ghats@example.com",
    verified: false,
    last_checked: "2026-10-25",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO04GM",
        platform: "youtube",
        title: "Wayanad 2-3 Days Boutique Estate Stays & Hidden Waterfalls (Rs 10,000 Plan)",
        description:
          "Mid-range coffee plantation cottages in Meppadi, private sunrise walks, Edakkal Caves, and romantic hilltop dinners.",
        places: ["Wayanad"],
      },
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO05GM",
        platform: "youtube",
        title: "Munnar + Kolukkumalai Sunrise Jeep Trip: Full Cost Breakdown",
        description:
          "Staying near Suryanelli, 4x4 jeep sunrise at the world's highest organic tea estate, and Top Station viewpoints.",
        places: ["Munnar"],
      },
    ],
  },
  {
    name: "Wilderness Retreats Kerala (Meera Varma)",
    platform: "instagram",
    profile_link: "https://www.instagram.com/wildernessretreatskl.demo/",
    followers_range: "100K - 500K",
    region: "Kerala, India",
    places_covered: ["Wayanad", "Munnar", "Varkala", "Thekkady"],
    travel_style: ["Luxury & Resorts", "Family Friendly", "Couple & Honeymoon"],
    budget_min_per_day: 4800,
    budget_max_per_day: 10000,
    min_days: 2,
    max_days: 5,
    language: ["English"],
    best_known_for:
      "Rainforest treehouses in Wayanad, private infinity-pool resorts in Munnar, boutique cliff resorts in Varkala, and curated family retreats.",
    best_season: "Jun - Sep (Monsoon)",
    contact: "meera.retreats@example.com",
    verified: true,
    last_checked: "2026-11-05",
    videos: [
      {
        url: "https://www.instagram.com/reel/TVFDEMO_MR01/",
        platform: "instagram",
        title: "Monsoon Treehouses & Rainforest Resorts in Vythiri, Wayanad",
        description:
          "Inside eco-luxury rainforest stays with heated pools, Ayurvedic spas, and guided morning birdwatching walks.",
        places: ["Wayanad"],
      },
      {
        url: "https://www.instagram.com/reel/TVFDEMO_MR02/",
        platform: "instagram",
        title: "Luxury Tea Bungalows in Munnar for a 3-Day Family Escape",
        description:
          "Colonial planter bungalows, private tea tasting sessions, and kid-friendly nature trails across Chinnakanal.",
        places: ["Munnar"],
      },
    ],
  },
  {
    name: "Munnar Trail Journal (Nikhil Raj)",
    platform: "youtube",
    profile_link: "https://www.youtube.com/@munnartrailjournal-demo",
    followers_range: "10K - 50K",
    region: "Kerala, India",
    places_covered: ["Munnar", "Vagamon", "Thekkady"],
    travel_style: ["Adventure & Trekking", "Budget & Backpacking", "Road Trip & Bike"],
    budget_min_per_day: 2000,
    budget_max_per_day: 4000,
    min_days: 1,
    max_days: 5,
    language: ["Malayalam", "Tamil"],
    best_known_for:
      "Meesapulimala & Chokramudi treks, offbeat Munnar tent camps, local tea-shop breakfasts, and detailed GPS route guides.",
    best_season: "Oct - Feb (Winter & Peak)",
    contact: "nikhil.munnartrails@example.com",
    verified: true,
    last_checked: "2026-10-30",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO06MN",
        platform: "youtube",
        title: "Munnar 3-Day Trekking & Offbeat Camps Itinerary (Rs 3,000/day)",
        description:
          "Chokramudi sunrise hike, KFDC Meesapulimala booking walkthrough, Suryanelli tent stay, and local puttu kadala spots.",
        places: ["Munnar"],
      },
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO07MN",
        platform: "youtube",
        title: "Vattavada & Top Station Ride from Munnar Town",
        description:
          "Quiet strawberry farms in Vattavada, Pampadum Shola forest drive, and budget homestays away from tourist traffic.",
        places: ["Munnar"],
      },
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO08VG",
        platform: "youtube",
        title: "Munnar to Vagamon Meadow Loop in 4 Days",
        description:
          "Scenic high-range biking loop connecting Gap Road, pine forests, and budget hill lodges.",
        places: ["Munnar", "Vagamon"],
      },
    ],
  },
  {
    name: "Tea Estate Tables (Ananya Krishnan)",
    platform: "instagram",
    profile_link: "https://www.instagram.com/teaestatetables.demo/",
    followers_range: "50K - 100K",
    region: "Kerala, India",
    places_covered: ["Munnar", "Wayanad", "Kochi", "Alleppey"],
    travel_style: ["Food & Culture", "Mid-Range Comfort", "Family Friendly"],
    budget_min_per_day: 3500,
    budget_max_per_day: 6000,
    min_days: 1,
    max_days: 7,
    language: ["English", "Hindi"],
    best_known_for:
      "Kerala toddy shop curries, Fort Kochi heritage culinary walks, Wayanad spice plantation lunches, and Munnar tea-estate stays.",
    best_season: "Oct - Feb (Winter & Peak)",
    contact: "ananya.tables@example.com",
    verified: false,
    last_checked: "2026-10-12",
    videos: [
      {
        url: "https://www.instagram.com/reel/TVFDEMO_AK01/",
        platform: "instagram",
        title: "Where to Eat in Munnar: Tea Factory Cafes & Traditional Sadya",
        description:
          "Fresh estate brews, banana-leaf sadya meals, and cozy mid-range stays in Devikulam and Old Munnar.",
        places: ["Munnar"],
      },
      {
        url: "https://www.instagram.com/reel/TVFDEMO_AK02/",
        platform: "instagram",
        title: "Kochi to Alleppey 4-Day Culinary & Backwater Route",
        description:
          "Fort Kochi seafood grills, Mattancherry spice merchants, and Kuttanad duck roast by the canals.",
        places: ["Kochi", "Alleppey"],
      },
      {
        url: "https://www.instagram.com/reel/TVFDEMO_AK03/",
        platform: "instagram",
        title: "Wayanad Spice Estate Stays & Bamboo Rice Meals (Rs 5,000/day)",
        description:
          "Coffee plantation homestays near Kalpetta, tribal kitchen lunches, and slow scenic drives across Wayanad.",
        places: ["Wayanad"],
      },
    ],
  },
  {
    name: "Varkala Salt & Sun (Karthik Pillai)",
    platform: "instagram",
    profile_link: "https://www.instagram.com/varkalasaltandsun.demo/",
    followers_range: "50K - 100K",
    region: "Kerala, India",
    places_covered: ["Varkala", "Kovalam", "Munroe Island"],
    travel_style: ["Slow Travel & Cafes", "Solo Travel", "Mid-Range Comfort"],
    budget_min_per_day: 1800,
    budget_max_per_day: 3000,
    min_days: 1,
    max_days: 4,
    language: ["English", "Malayalam"],
    best_known_for:
      "North Cliff vs South Cliff stay guide, beginner surfing schools, cliffside sunset cafes, and sunrise kayaking at Munroe Island.",
    best_season: "Oct - Feb (Winter & Peak)",
    contact: "karthik.varkala@example.com",
    verified: true,
    last_checked: "2026-11-08",
    videos: [
      {
        url: "https://www.instagram.com/reel/TVFDEMO_KP01/",
        platform: "instagram",
        title: "Varkala 2-Day Cliff Cafe & Surf Guide (Rs 6,000 Total)",
        description:
          "Best budget sea-view huts on North Cliff, morning surf lesson rates at Black Sand Beach, and Kappil estuary scooter ride.",
        places: ["Varkala"],
      },
      {
        url: "https://www.instagram.com/reel/TVFDEMO_KP02/",
        platform: "instagram",
        title: "Varkala to Munroe Island Sunrise Mangrove Kayaking Day Trip",
        description:
          "Catching the 5:30 AM train from Varkala Sivagiri to Munroe Island for Rs 500 canoe rides through mangrove tunnels.",
        places: ["Varkala", "Munroe Island"],
      },
    ],
  },
  {
    name: "Coastline Wanderers (Priya & Vikram)",
    platform: "youtube",
    profile_link: "https://www.youtube.com/@coastlinewanderers-demo",
    followers_range: "100K - 500K",
    region: "Kerala, India",
    places_covered: ["Varkala", "Kochi", "Alleppey"],
    travel_style: ["Couple & Honeymoon", "Slow Travel & Cafes", "Mid-Range Comfort"],
    budget_min_per_day: 2800,
    budget_max_per_day: 5000,
    min_days: 2,
    max_days: 7,
    language: ["Hindi", "English"],
    best_known_for:
      "South Cliff boutique cottages in Varkala, honest Alleppey houseboat pricing vs day cruises, and aesthetic Fort Kochi homestays.",
    best_season: "Oct - Feb (Winter & Peak)",
    contact: "hello.coastline@example.com",
    verified: true,
    last_checked: "2026-11-01",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO09VK",
        platform: "youtube",
        title: "Varkala 3 Days Complete Couple Guide: Stays, Cliff Cafes & Hidden Beaches",
        description:
          "Quiet South Cliff boutique stays, Odayam beach sunsets, Jatayu Earth's Center half-day trip, and honest meal costs.",
        places: ["Varkala"],
      },
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO10KC",
        platform: "youtube",
        title: "Kochi, Alleppey & Varkala 6-Day Coastal Kerala Route",
        description:
          "Day-by-day route connecting Fort Kochi heritage hotels, Alleppey sunset shikaras, and Varkala cliff cafes.",
        places: ["Kochi", "Alleppey", "Varkala"],
      },
    ],
  },
  {
    name: "Cliffside Nomad (Devika Mohan)",
    platform: "youtube",
    profile_link: "https://www.youtube.com/@cliffsidenomad-demo",
    followers_range: "10K - 50K",
    region: "Kerala, India",
    places_covered: ["Varkala", "Wayanad", "Kochi"],
    travel_style: ["Budget & Backpacking", "Solo Travel", "Food & Culture"],
    budget_min_per_day: 1500,
    budget_max_per_day: 2500,
    min_days: 2,
    max_days: 6,
    language: ["Malayalam", "English"],
    best_known_for:
      "Workation hostels in Varkala and Kochi, train-first Kerala itineraries, pocket-friendly cafes, and monsoon Wayanad trails.",
    best_season: "Year-round",
    contact: "devika.nomad@example.com",
    verified: false,
    last_checked: "2026-10-20",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO11VK",
        platform: "youtube",
        title: "Varkala Backpacker Hostel & Workation Cost Breakdown (Rs 2,000/day)",
        description:
          "Testing Wi-Fi speeds at Varkala cliff hostels, scooter rental prices, and Rs 150 local seafood thali lunches.",
        places: ["Varkala"],
      },
      {
        url: "https://www.youtube.com/watch?v=TVFDEMO12WY",
        platform: "youtube",
        title: "Kochi to Wayanad by Train + Bus: 4-Day Monsoon Budget Vlog",
        description:
          "Scenic Kozhikode train ride, KSRTC uphill bus to Kalpetta, foggy tea gardens, and warm homestay meals.",
        places: ["Kochi", "Wayanad"],
      },
    ],
  },
  {
    name: "Fort Kochi Walkers (Faisal K)",
    platform: "instagram",
    profile_link: "https://www.instagram.com/fortkochiwalkers.demo/",
    followers_range: "10K - 50K",
    region: "Kerala, India",
    places_covered: ["Kochi", "Alleppey", "Thrissur"],
    travel_style: ["Food & Culture", "Family Friendly", "Budget & Backpacking"],
    budget_min_per_day: 1000,
    budget_max_per_day: 2000,
    min_days: 1,
    max_days: 3,
    language: ["Malayalam", "English", "Hindi"],
    best_known_for:
      "Fort Kochi & Mattancherry heritage walking routes, Kadamakkudy sunrise kayaking, street-food gems, and Athirappilly day trips.",
    best_season: "Year-round",
    contact: "faisal.kochi@example.com",
    verified: true,
    last_checked: "2026-11-10",
    videos: [
      {
        url: "https://www.instagram.com/reel/TVFDEMO_FK01/",
        platform: "instagram",
        title: "Fort Kochi in 48 Hours Under Rs 4,000 | Ferry, Cafes & Murals",
        description:
          "Budget heritage homestays on Princess Street, Mattancherry Dutch Palace, Kashi Art Cafe, and street seafood by sunset.",
        places: ["Kochi"],
      },
      {
        url: "https://www.instagram.com/reel/TVFDEMO_FK02/",
        platform: "instagram",
        title: "Kadamakkudy Islands Morning Kayaking Near Kochi",
        description:
          "Just 30 minutes from Ernakulam: peaceful pokkali paddy fields, mangrove kayaking, and Rs 200 local kappa fish curry.",
        places: ["Kochi"],
      },
      {
        url: "https://www.instagram.com/reel/TVFDEMO_FK03/",
        platform: "instagram",
        title: "Kochi to Athirappilly Waterfalls Budget Day Trip",
        description:
          "Early morning drive via Chalakudy, Vazhachal forest route, and family-friendly picnic viewpoints.",
        places: ["Kochi", "Thrissur"],
      },
    ],
  },
];
