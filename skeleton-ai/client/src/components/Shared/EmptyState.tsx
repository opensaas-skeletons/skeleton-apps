import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-surface-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-surface-500 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
