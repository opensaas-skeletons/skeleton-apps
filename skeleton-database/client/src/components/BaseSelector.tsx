import { useEffect, useRef } from "react";
import type { Base } from "@shared/types/database";
import { BASE_COLORS } from "@shared/constants";

interface BaseSelectorProps {
  bases: Base[];
  currentBaseId: string;
  onSelect: (base: Base) => void;
  onBackToList: () => void;
  onClose: () => void;
}

export default function BaseSelector({
  bases,
  currentBaseId,
  onSelect,
  onBackToList,
  onClose,
}: BaseSelectorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-3 right-3 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <div className="max-h-60 overflow-auto py-1">
        {bases.map((base) => {
          const color = base.color || BASE_COLORS[0];
          const isActive = base.id === currentBaseId;
          return (
            <button
              key={base.id}
              onClick={() => onSelect(base)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-50 transition-colors ${
                isActive ? "bg-brand-50" : ""
              }`}
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: color }}
              >
                {base.icon || base.title.charAt(0).toUpperCase()}
              </div>
              <span
                className={`text-sm truncate ${
                  isActive
                    ? "font-semibold text-brand-700"
                    : "text-surface-700"
                }`}
              >
                {base.title}
              </span>
              {isActive && (
                <svg
                  className="w-4 h-4 text-brand-500 ml-auto shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      <div className="border-t border-surface-200">
        <button
          onClick={onBackToList}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
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
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          All Bases
        </button>
      </div>
    </div>
  );
}
