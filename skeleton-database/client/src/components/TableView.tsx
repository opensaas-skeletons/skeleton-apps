import { useEffect, useState, useCallback } from "react";
import type { Row } from "@shared/types/database";
import { useTable } from "../hooks/useTable";
import Toolbar from "./toolbar/Toolbar";
import GridView from "./grid/GridView";
import FormView from "./views/FormView";
import RecordDetailModal from "./modals/RecordDetailModal";

interface TableViewProps {
  tableId: string;
}

export default function TableView({ tableId }: TableViewProps) {
  const table = useTable();
  const [viewMode, setViewMode] = useState<"grid" | "form">("grid");
  const [detailRow, setDetailRow] = useState<Row | null>(null);

  useEffect(() => {
    table.fetchTableData(tableId);
  }, [tableId]);

  const handleExpandRow = useCallback(
    (row: Row) => {
      setDetailRow(row);
    },
    []
  );

  const handleCloseDetail = useCallback(() => {
    setDetailRow(null);
  }, []);

  const activeView = table.views.find((v) => v.id === table.activeViewId);
  const currentViewType = activeView?.view_type || viewMode;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Toolbar
        fields={table.fields}
        views={table.views}
        activeViewId={table.activeViewId}
        filters={table.filters}
        sorts={table.sorts}
        search={table.search}
        tableId={tableId}
        onSetFilters={table.setFilters}
        onSetSorts={table.setSorts}
        onSetSearch={table.setSearch}
        onSetActiveView={table.setActiveView}
        onAddView={table.addView}
        onRemoveView={table.removeView}
        onAddRow={() => table.addRow()}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
      />
      <div className="flex-1 overflow-hidden">
        {currentViewType === "grid" ? (
          <GridView
            fields={table.fields}
            rows={table.rows}
            page={table.page}
            perPage={table.perPage}
            total={table.total}
            loading={table.loading}
            tableId={tableId}
            onUpdateCell={table.updateCell}
            onAddRow={() => table.addRow()}
            onDeleteRow={table.removeRow}
            onPageChange={table.setPage}
            onExpandRow={handleExpandRow}
            onAddField={table.addField}
            onUpdateField={table.editField}
            onDeleteField={table.removeField}
          />
        ) : (
          <FormView
            fields={table.fields}
            rows={table.rows}
            onUpdateCell={table.updateCell}
            onAddRow={() => table.addRow()}
          />
        )}
      </div>
      {detailRow && (
        <RecordDetailModal
          row={detailRow}
          fields={table.fields}
          onUpdateCell={table.updateCell}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
