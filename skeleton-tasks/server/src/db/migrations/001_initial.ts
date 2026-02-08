/**
 * Database Migration — v1.0
 * =========================
 * Creates the core tables for the task tracker skeleton.
 *
 * Run with: npm run migrate
 *
 * LLM BUILDERS: If you need to add new tables (e.g., comments, time_entries),
 * create a new migration file like 002_add_comments.ts and add your ALTER/CREATE
 * statements there. Don't modify this file — keep migrations additive.
 */

import pool from "../connection";

const MIGRATION_SQL = `
  -- Enable UUID generation
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Boards table
  CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Columns table (workflow stages)
  CREATE TABLE IF NOT EXISTS columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    wip_limit INTEGER,
    color VARCHAR(7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_columns_board ON columns(board_id);

  -- Tasks table
  CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority VARCHAR(10) NOT NULL DEFAULT 'medium'
      CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee VARCHAR(255),
    labels JSONB NOT NULL DEFAULT '[]',
    due_date TIMESTAMPTZ,
    position INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
  CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
  CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

  -- Auto-update updated_at on tasks
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
  CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

  DROP TRIGGER IF EXISTS boards_updated_at ON boards;
  CREATE TRIGGER boards_updated_at
    BEFORE UPDATE ON boards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
`;

async function migrate() {
  console.log("🔄 Running migrations...");
  try {
    await pool.query(MIGRATION_SQL);
    console.log("✅ Migrations complete!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
