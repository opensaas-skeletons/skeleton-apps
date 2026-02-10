import { getPool } from "./connection";
import { up as migration001 } from "./migrations/001_initial";
import { up as migration002 } from "./migrations/002_sync_tables";

async function migrate() {
  const pool = getPool();
  try {
    console.log("Running migrations...");
    await pool.query(migration001);
    console.log("001_initial complete");
    await pool.query(migration002);
    console.log("002_sync_tables complete");
    console.log("All migrations completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
