/**
 * Database Connection
 * ==================
 * Connects to PostgreSQL using the pg library.
 *
 * LLM BUILDERS: You generally don't need to modify this file.
 * Configure your database via environment variables in .env
 */

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "skeleton_tasks",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

// Test the connection on startup
pool.on("connect", () => {
  console.log("📦 Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
  process.exit(1);
});

/**
 * Helper to run a query with parameters.
 * Usage: const result = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Helper to run a query and return a single row.
 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Get the raw pool for transactions or advanced usage.
 */
export function getPool(): Pool {
  return pool;
}

export default pool;
