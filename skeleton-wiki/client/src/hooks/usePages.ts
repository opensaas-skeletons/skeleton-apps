import { useState, useEffect, useCallback, useRef } from "react";
import type { Page, PageTreeNode, PageVersion, SearchResult } from "@shared/types/wiki";
import * as api from "../api/client";

export function usePages(workspaceId: string | null) {
  const [pages, setPages] = useState<Page[]>([]);
  const [tree, setTree] = useState<PageTreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [pagesData, treeData] = await Promise.all([
        api.listPages(workspaceId),
        api.getPageTree(workspaceId),
      ]);
      setPages(pagesData);
      setTree(treeData);
    } catch (err) {
      console.error("Failed to load pages:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) refresh();
    else {
      setPages([]);
      setTree([]);
    }
  }, [workspaceId, refresh]);

  const create = useCallback(async (title: string, parentId?: string | null, content?: string) => {
    if (!workspaceId) return null;
    const page = await api.createPage({
      workspace_id: workspaceId,
      title,
      parent_id: parentId,
      content,
    });
    await refresh();
    return page;
  }, [workspaceId, refresh]);

  const update = useCallback(async (id: string, input: { title?: string; content?: string; parent_id?: string | null; icon?: string; is_pinned?: boolean }) => {
    const page = await api.updatePage(id, input);
    await refresh();
    return page;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await api.deletePage(id);
    await refresh();
  }, [refresh]);

  return { pages, tree, loading, refresh, create, update, remove };
}

export function usePage(pageId: string | null) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!pageId) {
      setPage(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getPage(pageId);
      setPage(data);
    } catch (err) {
      console.error("Failed to load page:", err);
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { page, loading, refresh, setPage };
}

export function usePageVersions(pageId: string | null) {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!pageId) {
      setVersions([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getPageVersions(pageId);
      setVersions(data);
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { versions, loading, refresh };
}

export function useBacklinks(pageId: string | null) {
  const [backlinks, setBacklinks] = useState<Page[]>([]);

  useEffect(() => {
    if (!pageId) {
      setBacklinks([]);
      return;
    }
    api.getBacklinks(pageId).then(setBacklinks).catch(() => setBacklinks([]));
  }, [pageId]);

  return backlinks;
}

export function useSearch(workspaceId: string | null) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!workspaceId || !query.trim()) {
      setResults([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.searchPages(workspaceId, query);
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [workspaceId, query]);

  return { query, setQuery, results, searching };
}
