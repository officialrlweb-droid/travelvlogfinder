import fs from "node:fs/promises";
import path from "node:path";
import { getDb, getDbHolder, type DbClient } from "./client";
import { SEED_CREATORS } from "./seed-data";

const MIGRATIONS_DIR = path.join(
  process.cwd(),
  "netlify",
  "database",
  "migrations"
);

export async function runMigrations(db: DbClient = getDb()): Promise<string[]> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const existingRes = await db.query<{ filename: string }>(
    "SELECT filename FROM schema_migrations"
  );
  const applied = new Set(existingRes.rows.map((r) => r.filename));
  const newlyApplied: string[] = [];

  for (const filename of files) {
    if (applied.has(filename)) {
      continue;
    }
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, filename), "utf8");
    await db.exec(sql);
    await db.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
      [filename]
    );
    newlyApplied.push(filename);
  }

  return newlyApplied;
}

export async function seedDatabase(
  db: DbClient = getDb(),
  options: { reset?: boolean } = {}
): Promise<{ creatorsInserted: number; videosInserted: number; skipped: boolean }> {
  if (options.reset) {
    await db.exec("DELETE FROM profile_claims; DELETE FROM videos; DELETE FROM creators;");
  } else {
    const countRes = await db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM creators"
    );
    const existingCount = Number(countRes.rows[0]?.count ?? "0");
    if (existingCount > 0) {
      return { creatorsInserted: 0, videosInserted: 0, skipped: true };
    }
  }

  let creatorsInserted = 0;
  let videosInserted = 0;

  for (const creator of SEED_CREATORS) {
    const inserted = await db.query<{ id: string }>(
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
      RETURNING id
      `,
      [
        creator.name,
        creator.platform,
        creator.profile_link,
        creator.followers_range,
        creator.region,
        creator.places_covered,
        creator.travel_style,
        creator.budget_min_per_day,
        creator.budget_max_per_day,
        creator.min_days,
        creator.max_days,
        creator.language,
        creator.best_known_for,
        creator.best_season,
        creator.contact,
        creator.verified,
        creator.last_checked,
      ]
    );

    const creatorId = inserted.rows[0].id;
    creatorsInserted += 1;

    for (const video of creator.videos) {
      await db.query(
        `
        INSERT INTO videos (creator_id, url, platform, title, description, places)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          creatorId,
          video.url,
          video.platform,
          video.title,
          video.description,
          video.places,
        ]
      );
      videosInserted += 1;
    }
  }

  return { creatorsInserted, videosInserted, skipped: false };
}

export async function ensureDatabaseReady(): Promise<DbClient> {
  const holder = getDbHolder();
  const db = getDb();

  if (!holder.initPromise) {
    holder.initPromise = (async () => {
      // On Netlify Database, migrations in netlify/database/migrations/ are applied automatically at deploy time.
      if (!process.env.NETLIFY_DB_URL?.trim()) {
        await runMigrations(db);
      }
      if (process.env.AUTO_SEED_DEMO !== "false") {
        await seedDatabase(db);
      }
    })().catch((err) => {
      holder.initPromise = undefined;
      throw err;
    });
  }

  await holder.initPromise;
  return db;
}
