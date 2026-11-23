import { getDb, resetDbInstance } from "../src/lib/db/client";
import { runMigrations } from "../src/lib/db/init";

async function main() {
  const db = getDb();
  const applied = await runMigrations(db);
  console.log(
    `[db:migrate] Backend: ${db.backend}. Applied ${applied.length} migration(s): ${
      applied.length ? applied.join(", ") : "up to date"
    }`
  );
  await resetDbInstance();
}

main().catch((err) => {
  console.error("[db:migrate] Failed:", err);
  process.exit(1);
});
