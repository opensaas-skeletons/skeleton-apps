interface AddRowButtonProps {
  onAdd: () => void;
}

export default function AddRowButton({ onAdd }: AddRowButtonProps) {
  return (
    <button
      onClick={onAdd}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-400 hover:text-brand-600 hover:bg-surface-50 transition-colors border-b border-surface-100"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      New row
    </button>
  );
}
