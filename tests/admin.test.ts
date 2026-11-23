import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/admin/auth";
import { CSV_SAMPLE_TEMPLATE, parseCreatorsCsv } from "@/lib/admin/csv";
import {
  createCreator,
  createCreatorSubmission,
  createVideo,
  deleteCreator,
  deleteVideo,
  importCreatorsBulk,
  listAdminCreators,
  listCreatorSubmissions,
  listProfileClaims,
  reviewCreatorSubmission,
  reviewProfileClaim,
  updateCreator,
  updateVideo,
} from "@/lib/admin/repository";
import {
  validateCreatorInput,
  validateVideoInput,
} from "@/lib/admin/validation";
import { getDb, resetDbInstance } from "@/lib/db/client";
import { runMigrations, seedDatabase } from "@/lib/db/init";
import { searchCreators } from "@/lib/search/query";

describe("TravelVlogFinder Admin MVP & Creator Claim Flow", () => {
  before(async () => {
    process.env.PGLITE_DATA_DIR = "memory";
    delete process.env.DATABASE_URL;
    await resetDbInstance();
    const db = getDb();
    await runMigrations(db);
    await seedDatabase(db, { reset: true });
  });

  after(async () => {
    await resetDbInstance();
  });

  it("signs and verifies HMAC admin session tokens and rejects tampered/expired tokens", () => {
    const now = Date.now();
    const token = createAdminSessionToken(now);
    assert.equal(verifyAdminSessionToken(token, now + 1000), true);
    assert.equal(verifyAdminSessionToken(`${token}tampered`, now + 1000), false);
    assert.equal(
      verifyAdminSessionToken(token, now + 1000 * 60 * 60 * 24),
      false
    );
  });

  it("enforces fixed taxonomy values for platform, travel_style, language, and official video URLs", () => {
    const badCreator = validateCreatorInput({
      name: "Bad Filter Creator",
      platform: "tiktok",
      profileLink: "https://example.com",
      followersRange: "10K - 50K",
      region: "Kerala, India",
      placesCovered: ["Wayanad"],
      travelStyle: ["Made Up Style"],
      language: ["Klingon"],
      budgetMinPerDay: 1000,
      budgetMaxPerDay: 2000,
      minDays: 1,
      maxDays: 3,
    });
    assert.ok(badCreator.errors.length >= 3);

    const badVideo = validateVideoInput({
      creatorId: "00000000-0000-0000-0000-000000000000",
      url: "https://random-site.example/video.mp4",
      platform: "youtube",
      title: "Not official",
    });
    assert.ok(badVideo.errors.length >= 1);
  });

  it("parses CSV template cleanly, validates errors per row, and bulk imports valid creators", async () => {
    const db = getDb();
    const parsed = parseCreatorsCsv(CSV_SAMPLE_TEMPLATE);
    assert.equal(parsed.validCount, 2);
    assert.equal(parsed.invalidCount, 0);

    const mixedCsv = `${CSV_SAMPLE_TEMPLATE}"Broken Row",tiktok,bad-url,"10K - 50K","Kerala, India","UnknownPlace","FakeStyle",3000,1000,5,2,"FakeLang","note","Year-round","",false,2026-11-20`;
    const mixed = parseCreatorsCsv(mixedCsv);
    assert.equal(mixed.validCount, 2);
    assert.equal(mixed.invalidCount, 1);

    const imported = await importCreatorsBulk(
      parsed.rows.map((r) => r.data!),
      db
    );
    assert.equal(imported.length, 2);
    assert.ok(
      imported.some((c) => c.name.includes("Wayanad Cloud Trails")),
      "Bulk imported creator should exist in Postgres"
    );
  });

  it("supports full manual CRUD for creators and videos", async () => {
    const db = getDb();
    const validated = validateCreatorInput({
      name: "Vagamon Ridge Walks",
      platform: "youtube",
      profileLink: "https://www.youtube.com/@vagamonridge",
      followersRange: "10K - 50K",
      region: "Kerala, India",
      placesCovered: ["Vagamon", "Munnar"],
      travelStyle: ["Adventure & Trekking", "Budget & Backpacking"],
      language: ["Malayalam", "English"],
      budgetMinPerDay: 1400,
      budgetMaxPerDay: 2200,
      minDays: 2,
      maxDays: 4,
      bestKnownFor: "Pine forest hikes and paragliding budget breakdowns.",
      bestSeason: "Oct - Feb (Winter & Peak)",
      contact: "ridge@example.com",
      verified: false,
      lastChecked: "2026-11-20",
    });
    assert.equal(validated.errors.length, 0);

    const created = await createCreator(validated.data!, db);
    const updated = await updateCreator(
      created.id,
      { ...validated.data!, budgetMaxPerDay: 2400, verified: true },
      db
    );
    assert.equal(updated?.budgetMaxPerDay, 2400);
    assert.equal(updated?.verified, true);

    const videoValidation = validateVideoInput({
      creatorId: created.id,
      url: "https://youtu.be/dQw4w9WgXcQ",
      platform: "youtube",
      title: "Vagamon Pine Forest 2-Day Guide",
      description: "Meadows, homestay costs, and jeep timing.",
      places: ["Vagamon"],
    });
    assert.equal(videoValidation.errors.length, 0);

    const video = await createVideo(videoValidation.data!, db);
    assert.ok(video);

    const editedVideo = await updateVideo(
      video!.id,
      { ...videoValidation.data!, title: "Vagamon 2-Day Complete Guide" },
      db
    );
    assert.equal(editedVideo?.title, "Vagamon 2-Day Complete Guide");

    const videoDeleted = await deleteVideo(video!.id, db);
    assert.equal(videoDeleted, true);

    const creatorDeleted = await deleteCreator(created.id, db);
    assert.equal(creatorDeleted, true);
  });

  it("approves a creator profile claim and promotes the creator to Verified in traveler search", async () => {
    const db = getDb();
    const allCreators = await listAdminCreators(db);
    const unverified = allCreators.find((c) => !c.verified);
    assert.ok(unverified, "Seed data should include unverified creators");

    const insertedClaim = await db.query<{ id: string }>(
      `
      INSERT INTO profile_claims (creator_id, contact, verification_link, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [
        unverified!.id,
        "creator-owner@example.com",
        "https://www.youtube.com/@owner-proof",
        "Added TravelVlogFinder in bio",
      ]
    );

    const claimId = insertedClaim.rows[0].id;
    const beforeClaims = await listProfileClaims(db);
    assert.equal(
      beforeClaims.find((c) => c.id === claimId)?.status,
      "pending"
    );

    const approved = await reviewProfileClaim(claimId, "approve", db);
    assert.equal(approved?.status, "approved");
    assert.equal(approved?.creatorVerified, true);

    const searchRes = await searchCreators({ q: unverified!.name }, db);
    const matched = searchRes.creators.find((c) => c.id === unverified!.id);
    assert.ok(matched);
    assert.equal(matched!.verified, true);
  });

  it("handles public creator self-submission -> admin approval -> live verified creator with videos", async () => {
    const db = getDb();
    const validated = validateCreatorInput({
      name: "Kannur Coast Chronicles",
      platform: "youtube",
      profileLink: "https://www.youtube.com/@kannurcoast",
      followersRange: "10K - 50K",
      region: "Kerala, India",
      placesCovered: ["Kannur", "Wayanad"],
      travelStyle: ["Food & Culture", "Budget & Backpacking"],
      language: ["Malayalam", "English"],
      budgetMinPerDay: 1500,
      budgetMaxPerDay: 2800,
      minDays: 1,
      maxDays: 4,
      bestKnownFor: "Theyyam festival calendars and Muzhappilangad drive-in beach budget tips.",
      bestSeason: "Oct - Feb (Winter & Peak)",
      contact: "kannur@example.com",
      verified: false,
      lastChecked: "2026-11-23",
    });
    assert.equal(validated.errors.length, 0);

    const submitted = await createCreatorSubmission(
      validated.data!,
      [
        {
          url: "https://youtu.be/dQw4w9WgXcQ",
          platform: "youtube",
          title: "Kannur Theyyam & Drive-in Beach 2-Day Guide",
          description: "Complete budget plan for North Kerala.",
          places: ["Kannur"],
        },
      ],
      db
    );
    assert.equal(submitted.status, "pending");

    const queue = await listCreatorSubmissions(db);
    assert.ok(queue.some((s) => s.id === submitted.id));

    const approved = await reviewCreatorSubmission(submitted.id, "approve", db);
    assert.equal(approved?.submission.status, "approved");
    assert.ok(approved?.createdCreator?.id);
    assert.equal(approved?.createdCreator?.verified, true);
    assert.equal(approved?.createdCreator?.videos.length, 1);

    const searchRes = await searchCreators(
      { region: "Kerala, India", place: "Kannur", days: 2, totalBudget: 5000 },
      db
    );
    const liveCreator = searchRes.creators.find(
      (c) => c.id === approved?.createdCreator?.id
    );
    assert.ok(liveCreator, "Approved submission should be searchable live");
    assert.equal(liveCreator!.verified, true);
    assert.equal(liveCreator!.featuredVideos.length, 1);
  });
});
