import { getPool } from "./connection";
import { up as migration001 } from "./migrations/001_initial";

async function migrate() {
  const pool = getPool();
  try {
    console.log("Running migrations...");
    await pool.query(migration001);
    console.log("001_initial complete");
    console.log("All migrations completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
