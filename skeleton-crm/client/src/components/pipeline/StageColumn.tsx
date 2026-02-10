import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Stage, Deal } from "@shared/types/crm";
import DealCard from "./DealCard";

interface StageColumnProps {
  stage: Stage;
  deals: Deal[];
  onAddDeal: () => void;
  onEditDeal: (deal: Deal) => void;
  onDeleteDeal: (dealId: string) => void;
}

export default function StageColumn({ stage, deals, onAddDeal, onEditDeal, onDeleteDeal }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: { type: "stage", stageId: stage.id },
  });

  const totalValue = deals.reduce((sum, d) => sum + Number(d.value), 0);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="text-sm font-semibold text-surface-700">{stage.title}</h3>
          <span className="text-xs text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {stage.probability > 0 && (
            <span className="text-xs text-surface-400">{stage.probability}%</span>
          )}
          <button
            onClick={onAddDeal}
            className="p-0.5 text-surface-400 hover:text-brand-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      {totalValue > 0 && (
        <p className="text-xs text-surface-400 mb-2 px-1">{formatCurrency(totalValue)}</p>
      )}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg p-2 space-y-2 min-h-[100px] transition-colors ${
          isOver ? "bg-brand-50 border-2 border-dashed border-brand-300" : "bg-surface-50"
        }`}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={() => onEditDeal(deal)}
              onDelete={() => onDeleteDeal(deal.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
