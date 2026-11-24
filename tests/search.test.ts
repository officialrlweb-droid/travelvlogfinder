import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { BUDGET_DISCLAIMER_NOTE } from "@/lib/constants/taxonomy";
import { getDb, resetDbInstance } from "@/lib/db/client";
import { runMigrations, seedDatabase } from "@/lib/db/init";
import { parseOfficialEmbed } from "@/lib/embeds/official-embed";
import { calculateSpendBreakdown } from "@/lib/search/budget";
import { getCreatorProfileById } from "@/lib/search/profile";
import { searchCreators } from "@/lib/search/query";

describe("TravelVlogFinder PostgreSQL Search & Matching", () => {
  before(async () => {
    process.env.PGLITE_DATA_DIR = "memory";
    delete process.env.DATABASE_URL;
    await resetDbInstance();
    const db = getDb();
    await runMigrations(db);
    const seeded = await seedDatabase(db, { reset: true });
    assert.equal(seeded.creatorsInserted, 10, "Should seed 10 Kerala creators");
    assert.ok(seeded.videosInserted >= 20, "Should seed featured videos");
  });

  after(async () => {
    await resetDbInstance();
  });

  it("creates required Postgres tables and indexes (including FTS and Phase 2)", async () => {
    const db = getDb();
    const tables = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const tableNames = new Set(tables.rows.map((r) => r.table_name));
    assert.ok(tableNames.has("creators"));
    assert.ok(tableNames.has("videos"));
    assert.ok(tableNames.has("profile_claims"));
    assert.ok(tableNames.has("creator_submissions"));
    assert.ok(tableNames.has("video_transcripts"));
    assert.ok(tableNames.has("creator_oauth_connections"));

    const indexes = await db.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`
    );
    const indexNames = new Set(indexes.rows.map((r) => r.indexname));
    assert.ok(indexNames.has("idx_creators_region"));
    assert.ok(indexNames.has("idx_creators_places_covered_gin"));
    assert.ok(indexNames.has("idx_creators_budget_range"));
    assert.ok(indexNames.has("idx_creators_days_range"));
    assert.ok(indexNames.has("idx_creators_best_known_for_fts"));
    assert.ok(indexNames.has("idx_creators_search_vector_fts"));
    assert.ok(indexNames.has("idx_videos_search_vector_fts"));
  });

  it("matches Wayanad 2 days Rs 5,000, computes Rs 2,500/day, and sorts full fits before partial overlaps", async () => {
    const db = getDb();
    const res = await searchCreators(
      {
        region: "Kerala, India",
        place: "Wayanad",
        days: 2,
        totalBudget: 5000,
      },
      db
    );

    assert.equal(res.tripSummary.perDayBudget, 2500);
    assert.equal(res.tripSummary.headerText, "Your trip: 2 days x Rs 2,500/day");
    assert.equal(res.tripSummary.budgetNote, BUDGET_DISCLAIMER_NOTE);

    // Expect 4 creators whose [min, max] contains Rs 2,500/day:
    // 2 full fits (<= 2500) first, then 2 partial overlaps (> 2500)
    assert.equal(res.creators.length, 4);

    const names = res.creators.map((c) => c.name);
    assert.ok(
      !names.some((n) => n.includes("Wilderness Retreats")),
      "Luxury creator exceeding per-day budget must be excluded"
    );

    const fits = res.creators.map((c) => c.budgetFit);
    assert.deepEqual(fits, ["within", "within", "slightly_over", "slightly_over"]);

    for (const creator of res.creators) {
      assert.ok(creator.placesCovered.includes("Wayanad"));
      assert.ok(creator.minDays <= 2 && creator.maxDays >= 2);
      assert.ok(
        creator.budgetMinPerDay <= 2500 && creator.budgetMaxPerDay >= 2500,
        "Per-day budget must fall inside creator's [min, max] range"
      );
      assert.equal(creator.estimatedTotalMin, creator.budgetMinPerDay * 2);
      assert.equal(creator.estimatedTotalMax, creator.budgetMaxPerDay * 2);
      assert.ok(creator.featuredVideos.length >= 1 && creator.featuredVideos.length <= 3);
    }
  });

  it("matches Wayanad 2 days Rs 10,000 (Rs 5,000/day) with exact match first, then range overlaps, then lower fits", async () => {
    const db = getDb();
    const res = await searchCreators(
      {
        region: "Kerala, India",
        place: "Wayanad",
        days: 2,
        totalBudget: 10000,
      },
      db
    );

    assert.equal(res.tripSummary.perDayBudget, 5000);
    assert.equal(res.tripSummary.headerText, "Your trip: 2 days x Rs 5,000/day");
    assert.ok(res.creators.length >= 3);

    // #1 must be the exact full match (2,500-5,000/day)
    assert.match(res.creators[0].name, /Ghats & Mist/);
    assert.equal(res.creators[0].budgetFit, "within");
    assert.equal(res.creators[0].budgetMatchLevel, "exact");
    // Featured videos for a Wayanad search should strictly show Wayanad videos when available
    assert.ok(res.creators[0].featuredVideos.length >= 1);
    assert.ok(
      res.creators[0].featuredVideos.every((v) => v.places.includes("Wayanad")),
      "Featured videos should match searched destination when creator has place-specific videos"
    );

    // #2 and #3 must be direct range overlaps covering Rs 5,000/day (3,500-6,000 then 4,800-10,000)
    assert.match(res.creators[1].name, /Tea Estate Tables/);
    assert.equal(res.creators[1].budgetFit, "slightly_over");
    assert.equal(res.creators[1].budgetMatchLevel, "overlap");
    assert.match(res.creators[2].name, /Wilderness Retreats/);
    assert.equal(res.creators[2].budgetFit, "slightly_over");

    // Remaining creators are lower-budget full fits sorted closest-to-budget first
    for (const creator of res.creators.slice(3)) {
      assert.equal(creator.budgetFit, "within");
      assert.equal(creator.budgetMatchLevel, "under");
    }
  });

  it("matches Kerala 1 day Rs 4,000 (Rs 4,000/day) with exact Rs 4,000/day match first followed by closest matches", async () => {
    const db = getDb();
    const res = await searchCreators(
      {
        region: "Kerala, India",
        days: 1,
        totalBudget: 4000,
      },
      db
    );

    assert.equal(res.tripSummary.perDayBudget, 4000);
    assert.equal(res.tripSummary.headerText, "Your trip: 1 day x Rs 4,000/day");
    assert.ok(res.creators.length >= 4);

    // #1 exact match (2,000-4,000/day)
    assert.match(res.creators[0].name, /Munnar Trail Journal/);
    assert.equal(res.creators[0].budgetMatchLevel, "exact");
    assert.equal(res.creators[0].budgetFit, "within");

    // #2 direct range overlap (2,500-5,000/day) before #3 (3,500-6,000/day)
    assert.match(res.creators[1].name, /Ghats & Mist/);
    assert.equal(res.creators[1].budgetMatchLevel, "overlap");
    assert.match(res.creators[2].name, /Tea Estate Tables/);
    assert.equal(res.creators[2].budgetMatchLevel, "overlap");

    // Remaining under-budget creators sorted closest-to-4000 first (3,000 -> 2,500 -> 2,000)
    assert.match(res.creators[3].name, /Varkala Salt & Sun/);
    assert.equal(res.creators[3].budgetMatchLevel, "under");
  });

  it("matches Wayanad 2 days Rs 20,000 with luxury exact match first", async () => {
    const db = getDb();
    const wayanadLux = await searchCreators(
      {
        region: "Kerala, India",
        place: "Wayanad",
        days: 2,
        totalBudget: 20000,
      },
      db
    );
    assert.ok(wayanadLux.creators.length >= 1);
    assert.match(wayanadLux.creators[0].name, /Wilderness Retreats/);
    assert.equal(wayanadLux.creators[0].budgetFit, "within");
    assert.equal(wayanadLux.creators[0].budgetMatchLevel, "exact");
  });

  it("applies optional platform, travel style, and language multi-select filters", async () => {
    const db = getDb();
    const res = await searchCreators(
      {
        region: "Kerala, India",
        place: "Munnar",
        days: 3,
        totalBudget: 9000,
        platform: "youtube",
        languages: ["Tamil"],
      },
      db
    );

    assert.equal(res.creators.length, 1);
    assert.match(res.creators[0].name, /Munnar Trail Journal/);
    assert.equal(res.creators[0].platform, "youtube");
    assert.equal(res.creators[0].budgetFit, "slightly_over");
  });

  it("supports Postgres full-text search across creator name, best_known_for, and video titles/descriptions", async () => {
    const db = getDb();

    // Match in best_known_for ("toddy shop")
    const toddyRes = await searchCreators({ q: "toddy shop" }, db);
    assert.equal(toddyRes.creators.length, 1);
    assert.match(toddyRes.creators[0].name, /Tea Estate Tables/);

    // Match in video title/description ("Kolukkumalai")
    const kolukkuRes = await searchCreators({ q: "Kolukkumalai" }, db);
    assert.equal(kolukkuRes.creators.length, 1);
    assert.match(kolukkuRes.creators[0].name, /Ghats & Mist/);

    // Match in video description ("kayaking")
    const kayakRes = await searchCreators({ q: "kayaking" }, db);
    assert.equal(kayakRes.creators.length, 2);
  });

  it("parses official YouTube and Instagram embed URLs safely without scraping", () => {
    const yt = parseOfficialEmbed("https://youtu.be/dQw4w9WgXcQ");
    assert.ok(yt);
    assert.equal(yt.platform, "youtube");
    assert.equal(
      yt.embedUrl,
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"
    );
    assert.equal(yt.isDemoPlaceholder, false);

    const ig = parseOfficialEmbed("https://www.instagram.com/reel/CxYz12345Ab/");
    assert.ok(ig);
    assert.equal(ig.platform, "instagram");
    assert.equal(
      ig.embedUrl,
      "https://www.instagram.com/reel/CxYz12345Ab/embed/captioned/"
    );

    const invalid = parseOfficialEmbed("https://example.com/video/123");
    assert.equal(invalid, null);
  });

  it("loads an in-app Instagram-style creator profile with all videos and similar creators", async () => {
    const db = getDb();
    const res = await searchCreators({ place: "Wayanad" }, db);
    const first = res.creators[0];
    assert.ok(first);

    const profile = await getCreatorProfileById(first.id, db);
    assert.ok(profile);
    assert.equal(profile!.id, first.id);
    assert.equal(profile!.name, first.name);
    assert.ok(profile!.videos.length >= 1);
    assert.ok(profile!.similarCreators.length >= 1);
    assert.ok(
      profile!.similarCreators.every((s) => s.id !== first.id),
      "Similar creators should not include the profile itself"
    );

    const missing = await getCreatorProfileById("not-a-uuid", db);
    assert.equal(missing, null);
  });

  it("supports multi-stop Kerala route matching, ranking full-route creators first and building Watchlist Combos", async () => {
    const db = getDb();

    // Wayanad + Munnar: Ghats & Mist and Kerala on a Shoestring cover both stops
    const bothRes = await searchCreators(
      {
        region: "Kerala, India",
        places: ["Wayanad", "Munnar"],
        days: 4,
        totalBudget: 12000,
        travelers: 4,
      },
      db
    );

    assert.equal(bothRes.tripSummary.perDayBudget, 3000);
    assert.equal(bothRes.tripSummary.travelers, 4);
    assert.ok(bothRes.tripSummary.spendBreakdown);
    assert.equal(bothRes.tripSummary.spendBreakdown!.groupTotalPerDay, 12000);
    assert.ok(bothRes.tripSummary.routeCombo);
    assert.equal(
      bothRes.tripSummary.routeCombo!.allStopsCoveredBySingleCreator,
      true
    );
    assert.equal(bothRes.creators[0].matchedPlaces.length, 2);

    // Wayanad + Munroe Island: no single creator covers both -> Watchlist Combo pairs best creator per stop
    const comboRes = await searchCreators(
      {
        region: "Kerala, India",
        places: ["Wayanad", "Munroe Island"],
        days: 2,
        totalBudget: 6000,
      },
      db
    );
    assert.ok(comboRes.tripSummary.routeCombo);
    assert.equal(
      comboRes.tripSummary.routeCombo!.allStopsCoveredBySingleCreator,
      false
    );
    assert.equal(comboRes.tripSummary.routeCombo!.stops.length, 2);
    assert.ok(comboRes.tripSummary.routeCombo!.stops[0].creator);
    assert.ok(comboRes.tripSummary.routeCombo!.stops[1].creator);
    assert.equal(comboRes.tripSummary.routeCombo!.uniqueCreatorIds.length, 2);
  });

  it("calculates Kerala daily spend split and group room/cab sharing pools accurately", () => {
    const solo = calculateSpendBreakdown(2500, 1);
    assert.equal(
      solo.stayPerDay + solo.foodPerDay + solo.localTravelPerDay,
      2500
    );
    assert.equal(solo.groupTotalPerDay, 2500);

    const group4 = calculateSpendBreakdown(2500, 4);
    assert.equal(group4.groupTotalPerDay, 10000);
    assert.equal(group4.sharedRoomBudgetPerNight, group4.stayPerDay * 3);
    assert.equal(group4.sharedLocalTravelPerDay, group4.localTravelPerDay * 4);
  });
});
