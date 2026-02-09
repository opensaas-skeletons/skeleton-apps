import { query, queryOne, getPool } from "../db/connection";
import { NotFoundError, ValidationError, ConflictError } from "../errors";
import type {
  Page,
  PageVersion,
  WikiLink,
  CreatePageInput,
  UpdatePageInput,
  SearchResult,
  PageTreeNode,
} from "@shared/types/wiki";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---- Pages CRUD ----

export async function listPages(workspaceId: string): Promise<Page[]> {
  return query<Page>(
    "SELECT * FROM pages WHERE workspace_id = $1 ORDER BY position ASC, created_at ASC",
    [workspaceId]
  );
}

export async function getPageTree(workspaceId: string): Promise<PageTreeNode[]> {
  const pages = await listPages(workspaceId);
  const map = new Map<string, PageTreeNode>();
  const roots: PageTreeNode[] = [];

  for (const p of pages) {
    map.set(p.id, { ...p, children: [] });
  }

  for (const p of pages) {
    const node = map.get(p.id)!;
    if (p.parent_id && map.has(p.parent_id)) {
      map.get(p.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getPage(id: string): Promise<Page> {
  const page = await queryOne<Page>("SELECT * FROM pages WHERE id = $1", [id]);
  if (!page) {
    throw new NotFoundError("Page not found");
  }
  return page;
}

export async function getPageBySlug(workspaceId: string, slug: string): Promise<Page> {
  const page = await queryOne<Page>(
    "SELECT * FROM pages WHERE workspace_id = $1 AND slug = $2",
    [workspaceId, slug]
  );
  if (!page) {
    throw new NotFoundError("Page not found");
  }
  return page;
}

export async function createPage(input: CreatePageInput): Promise<Page> {
  if (!input.title || !input.title.trim()) {
    throw new ValidationError("Title is required");
  }

  let slug = slugify(input.title);
  if (!slug) slug = "untitled";

  // Ensure unique slug within workspace
  const existing = await queryOne<Page>(
    "SELECT id FROM pages WHERE workspace_id = $1 AND slug = $2",
    [input.workspace_id, slug]
  );
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  // Get next position
  const posResult = await queryOne<{ max_pos: number }>(
    "SELECT COALESCE(MAX(position), -1) as max_pos FROM pages WHERE workspace_id = $1 AND parent_id IS NOT DISTINCT FROM $2",
    [input.workspace_id, input.parent_id || null]
  );
  const position = (posResult?.max_pos ?? -1) + 1;

  const page = await queryOne<Page>(
    `INSERT INTO pages (workspace_id, parent_id, title, slug, content, icon, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.workspace_id,
      input.parent_id || null,
      input.title.trim(),
      slug,
      input.content || "",
      input.icon || "📄",
      position,
    ]
  );

  // Create initial version
  await query(
    `INSERT INTO page_versions (page_id, title, content, version_number)
     VALUES ($1, $2, $3, $4)`,
    [page!.id, page!.title, page!.content, 1]
  );

  return page!;
}

export async function updatePage(id: string, input: UpdatePageInput): Promise<Page> {
  const existing = await getPage(id);

  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  let contentChanged = false;

  if (input.title !== undefined) {
    if (!input.title.trim()) {
      throw new ValidationError("Title cannot be empty");
    }
    setClauses.push(`title = $${paramIndex++}`);
    values.push(input.title.trim());

    // Update slug if title changed
    let newSlug = slugify(input.title);
    if (!newSlug) newSlug = "untitled";
    const slugConflict = await queryOne<Page>(
      "SELECT id FROM pages WHERE workspace_id = $1 AND slug = $2 AND id != $3",
      [existing.workspace_id, newSlug, id]
    );
    if (slugConflict) {
      newSlug = `${newSlug}-${Date.now()}`;
    }
    setClauses.push(`slug = $${paramIndex++}`);
    values.push(newSlug);
  }
  if (input.content !== undefined) {
    setClauses.push(`content = $${paramIndex++}`);
    values.push(input.content);
    contentChanged = true;
  }
  if (input.parent_id !== undefined) {
    setClauses.push(`parent_id = $${paramIndex++}`);
    values.push(input.parent_id);
  }
  if (input.icon !== undefined) {
    setClauses.push(`icon = $${paramIndex++}`);
    values.push(input.icon);
  }
  if (input.position !== undefined) {
    setClauses.push(`position = $${paramIndex++}`);
    values.push(input.position);
  }
  if (input.is_pinned !== undefined) {
    setClauses.push(`is_pinned = $${paramIndex++}`);
    values.push(input.is_pinned);
  }

  if (setClauses.length === 0) {
    return existing;
  }

  values.push(id);
  const updated = await queryOne<Page>(
    `UPDATE pages SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  // Create version snapshot if content or title changed
  if (contentChanged || input.title !== undefined) {
    const versionCount = await queryOne<{ cnt: string }>(
      "SELECT COUNT(*) as cnt FROM page_versions WHERE page_id = $1",
      [id]
    );
    const nextVersion = parseInt(versionCount?.cnt || "0") + 1;

    await query(
      `INSERT INTO page_versions (page_id, title, content, version_number)
       VALUES ($1, $2, $3, $4)`,
      [id, updated!.title, updated!.content, nextVersion]
    );
  }

  // Update wiki links if content changed
  if (contentChanged) {
    await updateWikiLinks(id, updated!.workspace_id, updated!.content);
  }

  return updated!;
}

export async function deletePage(id: string): Promise<void> {
  await getPage(id);
  await query("DELETE FROM pages WHERE id = $1", [id]);
}

// ---- Version History ----

export async function getPageVersions(pageId: string): Promise<PageVersion[]> {
  return query<PageVersion>(
    "SELECT * FROM page_versions WHERE page_id = $1 ORDER BY version_number DESC",
    [pageId]
  );
}

export async function getPageVersion(id: string): Promise<PageVersion> {
  const version = await queryOne<PageVersion>(
    "SELECT * FROM page_versions WHERE id = $1",
    [id]
  );
  if (!version) {
    throw new NotFoundError("Version not found");
  }
  return version;
}

export async function restorePageVersion(pageId: string, versionId: string): Promise<Page> {
  const version = await getPageVersion(versionId);
  if (version.page_id !== pageId) {
    throw new ValidationError("Version does not belong to this page");
  }

  return updatePage(pageId, {
    title: version.title,
    content: version.content,
  });
}

// ---- Search ----

export async function searchPages(workspaceId: string, searchQuery: string): Promise<SearchResult[]> {
  if (!searchQuery.trim()) return [];

  const tsQuery = searchQuery
    .trim()
    .split(/\s+/)
    .map((w) => w + ":*")
    .join(" & ");

  const results = await query<Page & { snippet: string; match_type: string }>(
    `SELECT p.*,
       ts_headline('english', p.content, to_tsquery('english', $2),
         'StartSel=**, StopSel=**, MaxFragments=1, MaxWords=30') as snippet,
       CASE
         WHEN p.title ILIKE '%' || $3 || '%' THEN 'title'
         ELSE 'content'
       END as match_type
     FROM pages p
     WHERE p.workspace_id = $1
       AND (
         to_tsvector('english', p.title || ' ' || p.content) @@ to_tsquery('english', $2)
         OR p.title ILIKE '%' || $3 || '%'
       )
     ORDER BY
       CASE WHEN p.title ILIKE '%' || $3 || '%' THEN 0 ELSE 1 END,
       ts_rank(to_tsvector('english', p.title || ' ' || p.content), to_tsquery('english', $2)) DESC
     LIMIT 100`,
    [workspaceId, tsQuery, searchQuery.trim()]
  );

  return results.map((r) => ({
    page: {
      id: r.id,
      workspace_id: r.workspace_id,
      parent_id: r.parent_id,
      title: r.title,
      slug: r.slug,
      content: r.content,
      icon: r.icon,
      position: r.position,
      is_pinned: r.is_pinned,
      created_at: r.created_at,
      updated_at: r.updated_at,
    },
    snippet: r.snippet,
    match_type: r.match_type as "title" | "content",
  }));
}

// ---- Wiki Links ----

export async function getBacklinks(pageId: string): Promise<Page[]> {
  return query<Page>(
    `SELECT p.* FROM pages p
     JOIN wiki_links wl ON wl.source_page_id = p.id
     WHERE wl.target_page_id = $1
     ORDER BY p.title`,
    [pageId]
  );
}

async function updateWikiLinks(pageId: string, workspaceId: string, content: string): Promise<void> {
  // Remove existing outgoing links
  await query("DELETE FROM wiki_links WHERE source_page_id = $1", [pageId]);

  // Parse [[wiki links]] from content
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  let match;
  const slugs = new Set<string>();

  while ((match = linkPattern.exec(content)) !== null) {
    const linkText = match[1].trim();
    const slug = slugify(linkText);
    if (slug) slugs.add(slug);
  }

  if (slugs.size === 0) return;

  // Find matching pages in the same workspace
  for (const slug of slugs) {
    const target = await queryOne<Page>(
      "SELECT id FROM pages WHERE workspace_id = $1 AND slug = $2 AND id != $3",
      [workspaceId, slug, pageId]
    );
    if (target) {
      await query(
        `INSERT INTO wiki_links (source_page_id, target_page_id)
         VALUES ($1, $2)
         ON CONFLICT (source_page_id, target_page_id) DO NOTHING`,
        [pageId, target.id]
      );
    }
  }
}
