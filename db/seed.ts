import { getDb, resetDbInstance } from "../src/lib/db/client";
import { runMigrations, seedDatabase } from "../src/lib/db/init";

async function main() {
  const reset = process.argv.includes("--reset");
  const db = getDb();
  await runMigrations(db);
  const result = await seedDatabase(db, { reset });

  if (result.skipped) {
    console.log(
      `[db:seed] Backend: ${db.backend}. Creators already present (pass --reset to re-seed).`
    );
  } else {
    console.log(
      `[db:seed] Backend: ${db.backend}. Seeded ${result.creatorsInserted} creators and ${result.videosInserted} videos.`
    );
  }

  await resetDbInstance();
}

main().catch((err) => {
  console.error("[db:seed] Failed:", err);
  process.exit(1);
});
