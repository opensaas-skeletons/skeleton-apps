/**
 * Migration Runner
 * Runs all migrations in order.
 */
import pool from "./connection";
import { up as migration001 } from "./migrations/001_initial";
import { up as migration002 } from "./migrations/002_notifications";

async function migrate() {
  console.log("Running migrations...");
  try {
    await pool.query(migration001);
    console.log("001_initial complete");
    await pool.query(migration002);
    console.log("002_notifications complete");
    console.log("All migrations complete!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
