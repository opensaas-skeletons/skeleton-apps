import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Deal } from "@shared/types/crm";

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
  onDelete: () => void;
}

export default function DealCard({ deal, onClick, onDelete }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: { type: "deal", deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-card hover:shadow-card-hover border border-surface-100 p-3 cursor-grab active:cursor-grabbing group transition-shadow"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <button onClick={onClick} className="text-left flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-800 truncate">{deal.title}</p>
          {deal.value > 0 && (
            <p className="text-sm font-semibold text-brand-600 mt-0.5">
              {formatCurrency(deal.value, deal.currency)}
            </p>
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-surface-400 hover:text-red-500 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {deal.contact_name && (
          <span className="text-xs text-surface-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {deal.contact_name}
          </span>
        )}
        {deal.company_name && (
          <span className="text-xs text-surface-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            {deal.company_name}
          </span>
        )}
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[deal.status] || statusColors.open}`}>
          {deal.status}
        </span>
      </div>
    </div>
  );
}
