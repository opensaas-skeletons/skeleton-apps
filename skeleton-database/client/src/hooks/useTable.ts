import { useState, useCallback, useRef } from "react";
import type {
  Field,
  Row,
  View,
  FilterCondition,
  SortCondition,
  CreateFieldInput,
  UpdateFieldInput,
  CreateViewInput,
  UpdateViewInput,
} from "@shared/types/database";
import { ROWS_PER_PAGE } from "@shared/constants";
import * as api from "../api/client";

export function useTable() {
  const [fields, setFields] = useState<Field[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [views, setViews] = useState<View[]>([]);
  const [activeViewId, setActiveViewIdState] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [perPage] = useState(ROWS_PER_PAGE);
  const [filters, setFiltersState] = useState<FilterCondition[]>([]);
  const [sorts, setSortsState] = useState<SortCondition[]>([]);
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(false);

  const currentTableId = useRef<string | null>(null);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchRows = useCallback(
    async (
      tableId: string,
      p: number,
      f: FilterCondition[],
      s: SortCondition[],
      q: string
    ) => {
      const result = await api.listRows(tableId, {
        page: p,
        per_page: ROWS_PER_PAGE,
        filters: f,
        sorts: s,
        search: q,
      });
      setRows(result.data);
      setTotal(result.total);
    },
    []
  );

  const fetchTableData = useCallback(
    async (tableId: string) => {
      setLoading(true);
      currentTableId.current = tableId;
      try {
        const [fieldsData, viewsData] = await Promise.all([
          api.listFields(tableId),
          api.listViews(tableId),
        ]);
        setFields(fieldsData.sort((a, b) => a.position - b.position));
        setViews(viewsData.sort((a, b) => a.position - b.position));
        setFiltersState([]);
        setSortsState([]);
        setSearchState("");
        setPageState(1);
        setActiveViewIdState(null);
        await fetchRows(tableId, 1, [], [], "");
      } catch (err: any) {
        console.error("Failed to load table data:", err);
      } finally {
        setLoading(false);
      }
    },
    [fetchRows]
  );

  const setPage = useCallback(
    async (p: number) => {
      if (!currentTableId.current) return;
      setPageState(p);
      await fetchRows(currentTableId.current, p, filters, sorts, search);
    },
    [filters, sorts, search, fetchRows]
  );

  const setSearch = useCallback(
    (q: string) => {
      setSearchState(q);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(async () => {
        if (!currentTableId.current) return;
        setPageState(1);
        await fetchRows(currentTableId.current, 1, filters, sorts, q);
      }, 300);
    },
    [filters, sorts, fetchRows]
  );

  const setFilters = useCallback(
    async (f: FilterCondition[]) => {
      setFiltersState(f);
      setPageState(1);
      if (!currentTableId.current) return;
      await fetchRows(currentTableId.current, 1, f, sorts, search);
    },
    [sorts, search, fetchRows]
  );

  const setSorts = useCallback(
    async (s: SortCondition[]) => {
      setSortsState(s);
      if (!currentTableId.current) return;
      await fetchRows(currentTableId.current, page, filters, s, search);
    },
    [page, filters, search, fetchRows]
  );

  const updateCell = useCallback(
    (rowId: string, fieldId: string, value: unknown) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, data: { ...r.data, [fieldId]: value } } : r
        )
      );

      const field = fields.find((f) => f.id === fieldId);
      const immediateTypes = [
        "checkbox",
        "select",
        "multi_select",
        "date",
        "rating",
      ];
      const isImmediate =
        field && immediateTypes.includes(field.field_type);

      const timerKey = `${rowId}:${fieldId}`;
      if (debounceTimers.current[timerKey]) {
        clearTimeout(debounceTimers.current[timerKey]);
      }

      const doSave = () => {
        api.updateRow(rowId, { data: { [fieldId]: value } }).catch((err) =>
          console.error("Failed to save cell:", err)
        );
        delete debounceTimers.current[timerKey];
      };

      if (isImmediate) {
        doSave();
      } else {
        debounceTimers.current[timerKey] = setTimeout(doSave, 300);
      }
    },
    [fields]
  );

  const addRow = useCallback(
    async (data: Record<string, unknown> = {}) => {
      if (!currentTableId.current) return;
      const row = await api.createRow({
        table_id: currentTableId.current,
        data,
      });
      setRows((prev) => [...prev, row]);
      setTotal((prev) => prev + 1);
      return row;
    },
    []
  );

  const removeRow = useCallback(async (id: string) => {
    await api.deleteRow(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    setTotal((prev) => prev - 1);
  }, []);

  const addField = useCallback(async (input: CreateFieldInput) => {
    const field = await api.createField(input);
    setFields((prev) =>
      [...prev, field].sort((a, b) => a.position - b.position)
    );
    return field;
  }, []);

  const editField = useCallback(
    async (id: string, input: UpdateFieldInput) => {
      const field = await api.updateField(id, input);
      setFields((prev) => prev.map((f) => (f.id === id ? field : f)));
      return field;
    },
    []
  );

  const removeField = useCallback(async (id: string) => {
    await api.deleteField(id);
    setFields((prev) => prev.filter((f) => f.id !== id));
    setRows((prev) =>
      prev.map((r) => {
        const newData = { ...r.data };
        delete newData[id];
        return { ...r, data: newData };
      })
    );
  }, []);

  const addView = useCallback(async (input: CreateViewInput) => {
    const view = await api.createView(input);
    setViews((prev) =>
      [...prev, view].sort((a, b) => a.position - b.position)
    );
    return view;
  }, []);

  const editView = useCallback(
    async (id: string, input: UpdateViewInput) => {
      const view = await api.updateView(id, input);
      setViews((prev) => prev.map((v) => (v.id === id ? view : v)));
      return view;
    },
    []
  );

  const removeView = useCallback(async (id: string) => {
    await api.deleteView(id);
    setViews((prev) => prev.filter((v) => v.id !== id));
    if (activeViewId === id) {
      setActiveViewIdState(null);
      setFiltersState([]);
      setSortsState([]);
      if (currentTableId.current) {
        await fetchRows(currentTableId.current, 1, [], [], search);
      }
    }
  }, [activeViewId, search, fetchRows]);

  const setActiveView = useCallback(
    async (viewId: string | null) => {
      setActiveViewIdState(viewId);
      if (!viewId || !currentTableId.current) {
        setFiltersState([]);
        setSortsState([]);
        setPageState(1);
        if (currentTableId.current) {
          await fetchRows(currentTableId.current, 1, [], [], search);
        }
        return;
      }
      const view = views.find((v) => v.id === viewId);
      if (!view) return;
      const vf = view.config.filters || [];
      const vs = view.config.sorts || [];
      setFiltersState(vf);
      setSortsState(vs);
      setPageState(1);
      await fetchRows(currentTableId.current, 1, vf, vs, search);
    },
    [views, search, fetchRows]
  );

  return {
    fields,
    rows,
    views,
    activeViewId,
    total,
    page,
    perPage,
    filters,
    sorts,
    search,
    loading,
    fetchTableData,
    setPage,
    setSearch,
    setFilters,
    setSorts,
    updateCell,
    addRow,
    removeRow,
    addField,
    editField,
    removeField,
    addView,
    editView,
    removeView,
    setActiveView,
  };
}
