import type { Field } from "@shared/types/database";

interface CellDisplayProps {
  field: Field;
  value: unknown;
}

function formatDate(val: unknown): string {
  if (!val) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(val as string));
  } catch {
    return String(val);
  }
}

function formatNumber(val: unknown, precision?: number): string {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (precision !== undefined && precision > 0) {
    return num.toFixed(precision);
  }
  return String(num);
}

export default function CellDisplay({ field, value }: CellDisplayProps) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-surface-300 text-sm">&nbsp;</span>;
  }

  switch (field.field_type) {
    case "text":
    case "phone":
      return (
        <span className="text-sm text-surface-800 truncate block">
          {String(value)}
        </span>
      );

    case "long_text":
      return (
        <span className="text-sm text-surface-800 truncate block">
          {String(value).split("\n")[0]}
        </span>
      );

    case "number":
      return (
        <span className="text-sm text-surface-800 text-right block font-mono">
          {formatNumber(value, field.config.precision)}
        </span>
      );

    case "checkbox":
      return (
        <span className="flex items-center justify-center">
          {value ? (
            <svg
              className="w-5 h-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-surface-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                strokeWidth={2}
              />
            </svg>
          )}
        </span>
      );

    case "select": {
      const strVal = String(value);
      const option = field.config.options?.find(
        (o) => o.label === strVal
      );
      const bgColor = option?.color || "#64748b";
      return (
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white truncate max-w-full"
          style={{ backgroundColor: bgColor }}
        >
          {strVal}
        </span>
      );
    }

    case "multi_select": {
      const values = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((v, i) => {
            const strVal = String(v);
            const option = field.config.options?.find(
              (o) => o.label === strVal
            );
            const bgColor = option?.color || "#64748b";
            return (
              <span
                key={i}
                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: bgColor }}
              >
                {strVal}
              </span>
            );
          })}
        </div>
      );
    }

    case "date":
      return (
        <span className="text-sm text-surface-800">{formatDate(value)}</span>
      );

    case "email":
      return (
        <span className="text-sm text-brand-600 truncate block">
          {String(value)}
        </span>
      );

    case "url":
      return (
        <span className="text-sm text-brand-600 truncate block">
          {String(value)}
        </span>
      );

    case "rating": {
      const rating = Number(value) || 0;
      return (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-sm ${
                star <= rating ? "text-amber-400" : "text-surface-300"
              }`}
            >
              {star <= rating ? "\u2605" : "\u2606"}
            </span>
          ))}
        </div>
      );
    }

    case "formula":
      return (
        <span className="text-sm text-surface-500 italic">
          {String(value)}
        </span>
      );

    case "relation": {
      const items = Array.isArray(value) ? value : [];
      return (
        <span className="text-sm text-surface-500">
          [{items.length} linked]
        </span>
      );
    }

    default:
      return (
        <span className="text-sm text-surface-800">{String(value)}</span>
      );
  }
}
