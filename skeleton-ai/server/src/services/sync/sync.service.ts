import { query, queryOne, getPool } from "../../db/connection";
import { NotFoundError, ValidationError, ConflictError } from "../../errors";
import { ingestSource } from "../ingestion/ingestion.service";
import * as gitService from "./git.service";
import type {
  SyncRepo,
  SyncHistory,
  CreateSyncRepoInput,
  UpdateSyncRepoInput,
} from "@shared/types/ai";

// In-memory lock to prevent concurrent syncs on same repo
const syncLocks = new Map<string, boolean>();

// ---- Repo CRUD ----

export async function listRepos(): Promise<SyncRepo[]> {
  return query<SyncRepo>("SELECT * FROM sync_repos ORDER BY created_at DESC");
}

export async function getRepo(id: string): Promise<SyncRepo> {
  const repo = await queryOne<SyncRepo>("SELECT * FROM sync_repos WHERE id = $1", [id]);
  if (!repo) throw new NotFoundError("Sync repo not found");
  return repo;
}

export async function createRepo(input: CreateSyncRepoInput): Promise<SyncRepo> {
  if (!input.repo_url?.trim()) {
    throw new ValidationError("Repository URL is required");
  }
  if (!input.title?.trim()) {
    throw new ValidationError("Title is required");
  }

  // Check for duplicate URL
  const existing = await queryOne(
    "SELECT id FROM sync_repos WHERE repo_url = $1",
    [input.repo_url.trim()]
  );
  if (existing) {
    throw new ConflictError("A sync repo with this URL already exists");
  }

  const repo = await queryOne<SyncRepo>(
    `INSERT INTO sync_repos (title, repo_url, branch, github_token, auto_sync, sync_interval_hours)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      input.title.trim(),
      input.repo_url.trim(),
      input.branch || "main",
      input.github_token || null,
      input.auto_sync !== false,
      input.sync_interval_hours || 168,
    ]
  );
  return repo!;
}

export async function updateRepo(id: string, input: UpdateSyncRepoInput): Promise<SyncRepo> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${paramCount++}`);
    values.push(input.title.trim());
  }
  if (input.branch !== undefined) {
    fields.push(`branch = $${paramCount++}`);
    values.push(input.branch);
  }
  if (input.github_token !== undefined) {
    fields.push(`github_token = $${paramCount++}`);
    values.push(input.github_token || null);
  }
  if (input.auto_sync !== undefined) {
    fields.push(`auto_sync = $${paramCount++}`);
    values.push(input.auto_sync);
  }
  if (input.sync_interval_hours !== undefined) {
    fields.push(`sync_interval_hours = $${paramCount++}`);
    values.push(input.sync_interval_hours);
  }

  if (fields.length === 0) return getRepo(id);

  values.push(id);
  const repo = await queryOne<SyncRepo>(
    `UPDATE sync_repos SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  if (!repo) throw new NotFoundError("Sync repo not found");
  return repo;
}

export async function deleteRepo(id: string): Promise<void> {
  const repo = await getRepo(id);

  // Delete linked source if it exists
  if (repo.source_id) {
    await query("DELETE FROM sources WHERE id = $1", [repo.source_id]);
  }

  // Remove cloned files
  await gitService.removeRepo(id);

  const result = await query("DELETE FROM sync_repos WHERE id = $1 RETURNING id", [id]);
  if (result.length === 0) throw new NotFoundError("Sync repo not found");
}

// ---- Sync Operations ----

export async function syncRepo(repoId: string): Promise<SyncHistory> {
  // Prevent concurrent sync on same repo
  if (syncLocks.get(repoId)) {
    throw new ConflictError("Sync already in progress for this repository");
  }

  syncLocks.set(repoId, true);
  const startedAt = new Date().toISOString();
  let historyId: string | undefined;

  try {
    const repo = await getRepo(repoId);

    // Create history record
    const history = await queryOne<SyncHistory>(
      `INSERT INTO sync_history (repo_id, status, started_at)
       VALUES ($1, 'running', $2) RETURNING *`,
      [repoId, startedAt]
    );
    historyId = history!.id;

    // Update repo status
    await query(
      "UPDATE sync_repos SET status = 'syncing', error_message = NULL WHERE id = $1",
      [repoId]
    );

    let commitHash: string;
    let filesChanged: string[] = [];
    let filesAdded = 0;
    let filesModified = 0;
    let filesRemoved = 0;

    const isExisting = await gitService.isRepo(repoId);

    if (!isExisting) {
      // First time — clone
      console.log(`[Sync] Cloning ${repo.repo_url} (branch: ${repo.branch})`);
      const result = await gitService.cloneRepo(
        repoId,
        repo.repo_url,
        repo.branch,
        repo.github_token || undefined
      );
      commitHash = result.commitHash;

      // Create linked source for this repo
      const source = await queryOne<{ id: string }>(
        `INSERT INTO sources (title, description, source_type, config, status)
         VALUES ($1, $2, 'directory', $3, 'pending') RETURNING id`,
        [
          `[Sync] ${repo.title}`,
          `Auto-synced from ${repo.repo_url}`,
          JSON.stringify({ path: gitService.getRepoFullPath(repoId) }),
        ]
      );

      // Link source to repo
      await query("UPDATE sync_repos SET source_id = $1, last_commit_hash = $2 WHERE id = $3", [
        source!.id,
        commitHash,
        repoId,
      ]);

      // Trigger full ingestion
      console.log(`[Sync] Triggering initial ingestion for source ${source!.id}`);
      ingestSource(source!.id).catch((err) => {
        console.error(`[Sync] Ingestion error for ${source!.id}:`, err.message);
      });
    } else {
      // Pull updates
      console.log(`[Sync] Pulling updates for ${repo.repo_url}`);
      const result = await gitService.pullRepo(
        repoId,
        repo.github_token || undefined,
        repo.repo_url
      );
      commitHash = result.commitHash;
      filesChanged = result.changedFiles;

      if (result.changed && repo.source_id) {
        // Count change types (approximate from git diff)
        filesModified = filesChanged.length;

        // Update commit hash
        await query("UPDATE sync_repos SET last_commit_hash = $1 WHERE id = $2", [
          commitHash,
          repoId,
        ]);

        // Trigger re-ingestion (the existing ingestion service handles hash-based diffing)
        console.log(`[Sync] ${filesChanged.length} files changed, triggering re-ingestion`);
        ingestSource(repo.source_id).catch((err) => {
          console.error(`[Sync] Re-ingestion error for ${repo.source_id}:`, err.message);
        });
      } else {
        console.log(`[Sync] No changes detected for ${repo.repo_url}`);
      }
    }

    // Update history record
    await query(
      `UPDATE sync_history SET
        status = 'success',
        commit_hash = $1,
        files_changed = $2,
        files_added = $3,
        files_modified = $4,
        files_removed = $5,
        completed_at = NOW()
       WHERE id = $6`,
      [commitHash, filesChanged.length, filesAdded, filesModified, filesRemoved, historyId]
    );

    // Update repo status
    await query(
      "UPDATE sync_repos SET status = 'synced', last_synced_at = NOW() WHERE id = $1",
      [repoId]
    );

    return (await queryOne<SyncHistory>("SELECT * FROM sync_history WHERE id = $1", [historyId]))!;
  } catch (err: any) {
    console.error(`[Sync] Error syncing repo ${repoId}:`, err.message);

    // Update history if created
    if (historyId) {
      await query(
        `UPDATE sync_history SET status = 'error', error_message = $1, completed_at = NOW() WHERE id = $2`,
        [err.message, historyId]
      );
    }

    // Update repo status
    await query(
      "UPDATE sync_repos SET status = 'error', error_message = $1 WHERE id = $2",
      [err.message, repoId]
    );

    // Retry tracking
    const repo = await queryOne<SyncRepo>("SELECT * FROM sync_repos WHERE id = $1", [repoId]);
    if (repo) {
      const retryCount = (repo.retry_count || 0) + 1;
      await query("UPDATE sync_repos SET retry_count = $1 WHERE id = $2", [retryCount, repoId]);
    }

    throw err;
  } finally {
    syncLocks.delete(repoId);
  }
}

export async function syncAllRepos(): Promise<{ synced: number; errors: number }> {
  const repos = await query<SyncRepo>(
    "SELECT * FROM sync_repos WHERE auto_sync = true AND status != 'syncing'"
  );

  let synced = 0;
  let errors = 0;

  for (const repo of repos) {
    try {
      await syncRepo(repo.id);
      synced++;
    } catch (err: any) {
      console.error(`[Sync] Failed to sync ${repo.title}:`, err.message);
      errors++;
    }
  }

  return { synced, errors };
}

// ---- History ----

export async function listHistory(
  repoId?: string,
  limit = 50
): Promise<SyncHistory[]> {
  if (repoId) {
    return query<SyncHistory>(
      "SELECT * FROM sync_history WHERE repo_id = $1 ORDER BY started_at DESC LIMIT $2",
      [repoId, limit]
    );
  }
  return query<SyncHistory>(
    "SELECT * FROM sync_history ORDER BY started_at DESC LIMIT $1",
    [limit]
  );
}

export async function getHistoryEntry(id: string): Promise<SyncHistory> {
  const entry = await queryOne<SyncHistory>("SELECT * FROM sync_history WHERE id = $1", [id]);
  if (!entry) throw new NotFoundError("Sync history entry not found");
  return entry;
}

// ---- Branches ----

export async function listRepoBranches(repoId: string): Promise<string[]> {
  const repo = await getRepo(repoId);
  const isExisting = await gitService.isRepo(repoId);
  if (!isExisting) {
    return [repo.branch || "main"];
  }
  return gitService.listBranches(repoId);
}

export async function switchBranch(repoId: string, branch: string): Promise<SyncRepo> {
  const repo = await getRepo(repoId);
  const isExisting = await gitService.isRepo(repoId);
  if (!isExisting) {
    throw new ValidationError("Repository has not been cloned yet. Trigger a sync first.");
  }

  await gitService.checkoutBranch(repoId, branch);
  const updated = await queryOne<SyncRepo>(
    "UPDATE sync_repos SET branch = $1 WHERE id = $2 RETURNING *",
    [branch, repoId]
  );

  // Trigger re-ingestion after branch switch
  if (repo.source_id) {
    ingestSource(repo.source_id).catch((err) => {
      console.error(`[Sync] Re-ingestion error after branch switch:`, err.message);
    });
  }

  return updated!;
}

// ---- Status ----

export async function getSyncStatus(): Promise<{
  total_repos: number;
  syncing: number;
  synced: number;
  errors: number;
  last_sync_at: string | null;
}> {
  const stats = await queryOne<{
    total: string;
    syncing: string;
    synced: string;
    errors: string;
    last_sync: string | null;
  }>(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'syncing') as syncing,
      COUNT(*) FILTER (WHERE status = 'synced') as synced,
      COUNT(*) FILTER (WHERE status = 'error') as errors,
      MAX(last_synced_at) as last_sync
    FROM sync_repos
  `);

  return {
    total_repos: parseInt(stats?.total || "0"),
    syncing: parseInt(stats?.syncing || "0"),
    synced: parseInt(stats?.synced || "0"),
    errors: parseInt(stats?.errors || "0"),
    last_sync_at: stats?.last_sync || null,
  };
}
