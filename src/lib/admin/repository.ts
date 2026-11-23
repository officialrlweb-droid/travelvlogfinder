import type { Platform } from "@/lib/constants/taxonomy";
import type { DbClient } from "@/lib/db/client";
import { ensureDatabaseReady } from "@/lib/db/init";
import type { CreatorMutationInput, VideoMutationInput } from "./validation";

export interface AdminVideoRecord {
  id: string;
  creatorId: string;
  url: string;
  platform: Platform;
  title: string;
  description: string;
  places: string[];
  createdAt: string;
}

export interface AdminCreatorRecord {
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
  contact: string;
  verified: boolean;
  lastChecked: string;
  createdAt: string;
  pendingClaimsCount: number;
  videos: AdminVideoRecord[];
}

export interface AdminClaimRecord {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPlatform: Platform;
  creatorProfileLink: string;
  creatorVerified: boolean;
  contact: string;
  verificationLink: string;
  notes: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  createdAt: string;
}

export interface SubmissionVideoInput {
  url: string;
  platform: Platform;
  title: string;
  description: string;
  places: string[];
}

export interface AdminSubmissionRecord {
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
  contact: string;
  sampleVideos: SubmissionVideoInput[];
  status: "pending" | "approved" | "rejected";
  approvedCreatorId: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface CreatorRow {
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
  contact: string;
  verified: boolean;
  last_checked: string | Date;
  created_at: string | Date;
  pending_claims_count: number | string;
}

interface VideoRow {
  id: string;
  creator_id: string;
  url: string;
  platform: Platform;
  title: string;
  description: string;
  places: string[];
  created_at: string | Date;
}

interface ClaimRow {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_platform: Platform;
  creator_profile_link: string;
  creator_verified: boolean;
  contact: string;
  verification_link: string;
  notes: string;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | Date | null;
  created_at: string | Date;
}

function toIsoDate(val: string | Date): string {
  return val instanceof Date
    ? val.toISOString().slice(0, 10)
    : String(val).slice(0, 10);
}

function toIsoTimestamp(val: string | Date): string {
  return val instanceof Date ? val.toISOString() : String(val);
}

function mapVideoRow(row: VideoRow): AdminVideoRecord {
  return {
    id: row.id,
    creatorId: row.creator_id,
    url: row.url,
    platform: row.platform,
    title: row.title,
    description: row.description,
    places: row.places ?? [],
    createdAt: toIsoTimestamp(row.created_at),
  };
}

function mapCreatorRow(
  row: CreatorRow,
  videos: AdminVideoRecord[]
): AdminCreatorRecord {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    profileLink: row.profile_link,
    followersRange: row.followers_range,
    region: row.region,
    placesCovered: row.places_covered ?? [],
    travelStyle: row.travel_style ?? [],
    budgetMinPerDay: row.budget_min_per_day,
    budgetMaxPerDay: row.budget_max_per_day,
    minDays: row.min_days,
    maxDays: row.max_days,
    language: row.language ?? [],
    bestKnownFor: row.best_known_for,
    bestSeason: row.best_season,
    contact: row.contact ?? "",
    verified: row.verified,
    lastChecked: toIsoDate(row.last_checked),
    createdAt: toIsoTimestamp(row.created_at),
    pendingClaimsCount: Number(row.pending_claims_count ?? 0),
    videos,
  };
}

export async function listAdminCreators(
  dbOverride?: DbClient
): Promise<AdminCreatorRecord[]> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const creatorsRes = await db.query<CreatorRow>(`
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
      c.contact,
      c.verified,
      c.last_checked,
      c.created_at,
      (
        SELECT COUNT(*)::int
        FROM profile_claims pc
        WHERE pc.creator_id = c.id AND pc.status = 'pending'
      ) AS pending_claims_count
    FROM creators c
    ORDER BY c.created_at DESC, c.name ASC
  `);

  const videosRes = await db.query<VideoRow>(`
    SELECT id, creator_id, url, platform, title, description, places, created_at
    FROM videos
    ORDER BY created_at DESC, title ASC
  `);

  const videosByCreator = new Map<string, AdminVideoRecord[]>();
  for (const v of videosRes.rows) {
    const arr = videosByCreator.get(v.creator_id) ?? [];
    arr.push(mapVideoRow(v));
    videosByCreator.set(v.creator_id, arr);
  }

  return creatorsRes.rows.map((c) =>
    mapCreatorRow(c, videosByCreator.get(c.id) ?? [])
  );
}

export async function createCreator(
  input: CreatorMutationInput,
  dbOverride?: DbClient
): Promise<AdminCreatorRecord> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const res = await db.query<CreatorRow>(
    `
    INSERT INTO creators (
      name,
      platform,
      profile_link,
      followers_range,
      region,
      places_covered,
      travel_style,
      budget_min_per_day,
      budget_max_per_day,
      min_days,
      max_days,
      language,
      best_known_for,
      best_season,
      contact,
      verified,
      last_checked
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    )
    RETURNING
      id, name, platform, profile_link, followers_range, region,
      places_covered, travel_style, budget_min_per_day, budget_max_per_day,
      min_days, max_days, language, best_known_for, best_season,
      contact, verified, last_checked, created_at,
      0 AS pending_claims_count
    `,
    [
      input.name,
      input.platform,
      input.profileLink,
      input.followersRange,
      input.region,
      input.placesCovered,
      input.travelStyle,
      input.budgetMinPerDay,
      input.budgetMaxPerDay,
      input.minDays,
      input.maxDays,
      input.language,
      input.bestKnownFor,
      input.bestSeason,
      input.contact,
      input.verified,
      input.lastChecked,
    ]
  );

  return mapCreatorRow(res.rows[0], []);
}

export async function updateCreator(
  id: string,
  input: CreatorMutationInput,
  dbOverride?: DbClient
): Promise<AdminCreatorRecord | null> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const res = await db.query<CreatorRow>(
    `
    UPDATE creators
    SET
      name = $2,
      platform = $3,
      profile_link = $4,
      followers_range = $5,
      region = $6,
      places_covered = $7,
      travel_style = $8,
      budget_min_per_day = $9,
      budget_max_per_day = $10,
      min_days = $11,
      max_days = $12,
      language = $13,
      best_known_for = $14,
      best_season = $15,
      contact = $16,
      verified = $17,
      last_checked = $18
    WHERE id = $1
    RETURNING
      id, name, platform, profile_link, followers_range, region,
      places_covered, travel_style, budget_min_per_day, budget_max_per_day,
      min_days, max_days, language, best_known_for, best_season,
      contact, verified, last_checked, created_at,
      (
        SELECT COUNT(*)::int
        FROM profile_claims pc
        WHERE pc.creator_id = creators.id AND pc.status = 'pending'
      ) AS pending_claims_count
    `,
    [
      id,
      input.name,
      input.platform,
      input.profileLink,
      input.followersRange,
      input.region,
      input.placesCovered,
      input.travelStyle,
      input.budgetMinPerDay,
      input.budgetMaxPerDay,
      input.minDays,
      input.maxDays,
      input.language,
      input.bestKnownFor,
      input.bestSeason,
      input.contact,
      input.verified,
      input.lastChecked,
    ]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const videosRes = await db.query<VideoRow>(
    `SELECT id, creator_id, url, platform, title, description, places, created_at
     FROM videos WHERE creator_id = $1 ORDER BY created_at DESC`,
    [id]
  );

  return mapCreatorRow(res.rows[0], videosRes.rows.map(mapVideoRow));
}

export async function deleteCreator(
  id: string,
  dbOverride?: DbClient
): Promise<boolean> {
  const db = dbOverride ?? (await ensureDatabaseReady());
  const res = await db.query<{ id: string }>(
    "DELETE FROM creators WHERE id = $1 RETURNING id",
    [id]
  );
  return res.rows.length > 0;
}

export async function createVideo(
  input: VideoMutationInput,
  dbOverride?: DbClient
): Promise<AdminVideoRecord | null> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const creatorExists = await db.query<{ id: string }>(
    "SELECT id FROM creators WHERE id = $1",
    [input.creatorId]
  );
  if (creatorExists.rows.length === 0) {
    return null;
  }

  const res = await db.query<VideoRow>(
    `
    INSERT INTO videos (creator_id, url, platform, title, description, places)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, creator_id, url, platform, title, description, places, created_at
    `,
    [
      input.creatorId,
      input.url,
      input.platform,
      input.title,
      input.description,
      input.places,
    ]
  );

  return mapVideoRow(res.rows[0]);
}

export async function updateVideo(
  id: string,
  input: Omit<VideoMutationInput, "creatorId">,
  dbOverride?: DbClient
): Promise<AdminVideoRecord | null> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const res = await db.query<VideoRow>(
    `
    UPDATE videos
    SET
      url = $2,
      platform = $3,
      title = $4,
      description = $5,
      places = $6
    WHERE id = $1
    RETURNING id, creator_id, url, platform, title, description, places, created_at
    `,
    [id, input.url, input.platform, input.title, input.description, input.places]
  );

  if (res.rows.length === 0) {
    return null;
  }

  return mapVideoRow(res.rows[0]);
}

export async function deleteVideo(
  id: string,
  dbOverride?: DbClient
): Promise<boolean> {
  const db = dbOverride ?? (await ensureDatabaseReady());
  const res = await db.query<{ id: string }>(
    "DELETE FROM videos WHERE id = $1 RETURNING id",
    [id]
  );
  return res.rows.length > 0;
}

export async function importCreatorsBulk(
  inputs: CreatorMutationInput[],
  dbOverride?: DbClient
): Promise<AdminCreatorRecord[]> {
  const db = dbOverride ?? (await ensureDatabaseReady());
  const inserted: AdminCreatorRecord[] = [];
  for (const input of inputs) {
    const record = await createCreator(input, db);
    inserted.push(record);
  }
  return inserted;
}

export async function listProfileClaims(
  dbOverride?: DbClient
): Promise<AdminClaimRecord[]> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const res = await db.query<ClaimRow>(`
    SELECT
      pc.id,
      pc.creator_id,
      c.name AS creator_name,
      c.platform AS creator_platform,
      c.profile_link AS creator_profile_link,
      c.verified AS creator_verified,
      pc.contact,
      pc.verification_link,
      pc.notes,
      pc.status,
      pc.reviewed_at,
      pc.created_at
    FROM profile_claims pc
    JOIN creators c ON c.id = pc.creator_id
    ORDER BY
      CASE WHEN pc.status = 'pending' THEN 0 ELSE 1 END ASC,
      pc.created_at DESC
  `);

  return res.rows.map((r) => ({
    id: r.id,
    creatorId: r.creator_id,
    creatorName: r.creator_name,
    creatorPlatform: r.creator_platform,
    creatorProfileLink: r.creator_profile_link,
    creatorVerified: r.creator_verified,
    contact: r.contact,
    verificationLink: r.verification_link,
    notes: r.notes,
    status: r.status,
    reviewedAt: r.reviewed_at ? toIsoTimestamp(r.reviewed_at) : null,
    createdAt: toIsoTimestamp(r.created_at),
  }));
}

export async function reviewProfileClaim(
  claimId: string,
  action: "approve" | "reject",
  dbOverride?: DbClient
): Promise<AdminClaimRecord | null> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const nextStatus = action === "approve" ? "approved" : "rejected";
  const updated = await db.query<{
    id: string;
    creator_id: string;
    contact: string;
  }>(
    `
    UPDATE profile_claims
    SET status = $2, reviewed_at = NOW()
    WHERE id = $1
    RETURNING id, creator_id, contact
    `,
    [claimId, nextStatus]
  );

  if (updated.rows.length === 0) {
    return null;
  }

  const { creator_id: creatorId, contact } = updated.rows[0];
  if (action === "approve") {
    await db.query(
      `
      UPDATE creators
      SET
        verified = TRUE,
        last_checked = CURRENT_DATE,
        contact = CASE WHEN trim(coalesce(contact, '')) = '' THEN $2 ELSE contact END
      WHERE id = $1
      `,
      [creatorId, contact]
    );
  }

  const claims = await listProfileClaims(db);
  return claims.find((c) => c.id === claimId) ?? null;
}

interface SubmissionRow {
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
  contact: string;
  sample_videos: SubmissionVideoInput[] | string;
  status: "pending" | "approved" | "rejected";
  approved_creator_id: string | null;
  reviewed_at: string | Date | null;
  created_at: string | Date;
}

function mapSubmissionRow(row: SubmissionRow): AdminSubmissionRecord {
  let sampleVideos: SubmissionVideoInput[] = [];
  if (Array.isArray(row.sample_videos)) {
    sampleVideos = row.sample_videos;
  } else if (typeof row.sample_videos === "string") {
    try {
      const parsed = JSON.parse(row.sample_videos);
      if (Array.isArray(parsed)) sampleVideos = parsed;
    } catch {
      sampleVideos = [];
    }
  }

  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    profileLink: row.profile_link,
    followersRange: row.followers_range,
    region: row.region,
    placesCovered: row.places_covered ?? [],
    travelStyle: row.travel_style ?? [],
    budgetMinPerDay: row.budget_min_per_day,
    budgetMaxPerDay: row.budget_max_per_day,
    minDays: row.min_days,
    maxDays: row.max_days,
    language: row.language ?? [],
    bestKnownFor: row.best_known_for,
    bestSeason: row.best_season,
    contact: row.contact,
    sampleVideos,
    status: row.status,
    approvedCreatorId: row.approved_creator_id,
    reviewedAt: row.reviewed_at ? toIsoTimestamp(row.reviewed_at) : null,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

export async function createCreatorSubmission(
  input: CreatorMutationInput,
  sampleVideos: SubmissionVideoInput[],
  dbOverride?: DbClient
): Promise<AdminSubmissionRecord> {
  const db = dbOverride ?? (await ensureDatabaseReady());
  const res = await db.query<SubmissionRow>(
    `
    INSERT INTO creator_submissions (
      name,
      platform,
      profile_link,
      followers_range,
      region,
      places_covered,
      travel_style,
      budget_min_per_day,
      budget_max_per_day,
      min_days,
      max_days,
      language,
      best_known_for,
      best_season,
      contact,
      sample_videos
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb
    )
    RETURNING *
    `,
    [
      input.name,
      input.platform,
      input.profileLink,
      input.followersRange,
      input.region,
      input.placesCovered,
      input.travelStyle,
      input.budgetMinPerDay,
      input.budgetMaxPerDay,
      input.minDays,
      input.maxDays,
      input.language,
      input.bestKnownFor,
      input.bestSeason,
      input.contact,
      JSON.stringify(sampleVideos),
    ]
  );

  return mapSubmissionRow(res.rows[0]);
}

export async function listCreatorSubmissions(
  dbOverride?: DbClient
): Promise<AdminSubmissionRecord[]> {
  const db = dbOverride ?? (await ensureDatabaseReady());
  const res = await db.query<SubmissionRow>(`
    SELECT *
    FROM creator_submissions
    ORDER BY
      CASE WHEN status = 'pending' THEN 0 ELSE 1 END ASC,
      created_at DESC
  `);
  return res.rows.map(mapSubmissionRow);
}

export async function reviewCreatorSubmission(
  submissionId: string,
  action: "approve" | "reject",
  dbOverride?: DbClient
): Promise<{
  submission: AdminSubmissionRecord;
  createdCreator?: AdminCreatorRecord;
} | null> {
  const db = dbOverride ?? (await ensureDatabaseReady());

  const existingRes = await db.query<SubmissionRow>(
    "SELECT * FROM creator_submissions WHERE id = $1",
    [submissionId]
  );
  if (existingRes.rows.length === 0) {
    return null;
  }
  const submission = mapSubmissionRow(existingRes.rows[0]);

  if (action === "reject") {
    const updated = await db.query<SubmissionRow>(
      `
      UPDATE creator_submissions
      SET status = 'rejected', reviewed_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [submissionId]
    );
    return { submission: mapSubmissionRow(updated.rows[0]) };
  }

  // Approve: create live verified creator + their submitted official videos
  let createdCreator: AdminCreatorRecord | undefined;
  let creatorId = submission.approvedCreatorId;

  if (!creatorId) {
    const todayIso = new Date().toISOString().slice(0, 10);
    createdCreator = await createCreator(
      {
        name: submission.name,
        platform: submission.platform,
        profileLink: submission.profileLink,
        followersRange: submission.followersRange,
        region: submission.region,
        placesCovered: submission.placesCovered,
        travelStyle: submission.travelStyle,
        budgetMinPerDay: submission.budgetMinPerDay,
        budgetMaxPerDay: submission.budgetMaxPerDay,
        minDays: submission.minDays,
        maxDays: submission.maxDays,
        language: submission.language,
        bestKnownFor: submission.bestKnownFor,
        bestSeason: submission.bestSeason,
        contact: submission.contact,
        verified: true,
        lastChecked: todayIso,
      },
      db
    );
    creatorId = createdCreator.id;

    for (const v of submission.sampleVideos.slice(0, 3)) {
      const insertedVideo = await createVideo(
        {
          creatorId,
          url: v.url,
          platform: v.platform,
          title: v.title,
          description: v.description,
          places: v.places.length > 0 ? v.places : submission.placesCovered.slice(0, 2),
        },
        db
      );
      if (insertedVideo) {
        createdCreator.videos.push(insertedVideo);
      }
    }
  }

  const updated = await db.query<SubmissionRow>(
    `
    UPDATE creator_submissions
    SET status = 'approved', approved_creator_id = $2, reviewed_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [submissionId, creatorId]
  );

  return {
    submission: mapSubmissionRow(updated.rows[0]),
    createdCreator,
  };
}
