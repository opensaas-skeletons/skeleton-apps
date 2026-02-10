export const up = `
  -- Sync repos table
  CREATE TABLE IF NOT EXISTS sync_repos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    repo_url TEXT NOT NULL,
    branch VARCHAR(255) DEFAULT 'main',
    github_token TEXT,
    auto_sync BOOLEAN DEFAULT true,
    sync_interval_hours INT DEFAULT 168,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'error')),
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    last_commit_hash VARCHAR(64),
    last_synced_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Sync history table
  CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID NOT NULL REFERENCES sync_repos(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
    commit_hash VARCHAR(64),
    files_changed INT DEFAULT 0,
    files_added INT DEFAULT 0,
    files_modified INT DEFAULT 0,
    files_removed INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_sync_repos_status ON sync_repos(status);
  CREATE INDEX IF NOT EXISTS idx_sync_repos_source_id ON sync_repos(source_id);
  CREATE INDEX IF NOT EXISTS idx_sync_history_repo_id ON sync_history(repo_id);
  CREATE INDEX IF NOT EXISTS idx_sync_history_started_at ON sync_history(started_at DESC);

  -- Apply updated_at trigger to sync_repos
  DROP TRIGGER IF EXISTS trigger_sync_repos_updated_at ON sync_repos;
  CREATE TRIGGER trigger_sync_repos_updated_at
    BEFORE UPDATE ON sync_repos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;
