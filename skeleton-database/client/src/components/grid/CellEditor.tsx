import { useState, useRef, useEffect } from "react";
import type { Field } from "@shared/types/database";

interface CellEditorProps {
  field: Field;
  value: unknown;
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

export default function CellEditor({
  field,
  value,
  onSave,
  onCancel,
}: CellEditorProps) {
  switch (field.field_type) {
    case "text":
    case "phone":
      return (
        <TextEditor
          value={String(value ?? "")}
          onSave={onSave}
          onCancel={onCancel}
          type={field.field_type === "phone" ? "tel" : "text"}
        />
      );

    case "long_text":
      return (
        <LongTextEditor
          value={String(value ?? "")}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case "number":
      return (
        <NumberEditor
          value={value}
          precision={field.config.precision}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case "select":
      return (
        <SelectEditor
          value={String(value ?? "")}
          options={field.config.options || []}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case "multi_select":
      return (
        <MultiSelectEditor
          value={Array.isArray(value) ? (value as string[]) : []}
          options={field.config.options || []}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case "date":
      return (
        <DateEditor
          value={String(value ?? "")}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case "email":
      return (
        <TextEditor
          value={String(value ?? "")}
          onSave={onSave}
          onCancel={onCancel}
          type="email"
        />
      );

    case "url":
      return (
        <TextEditor
          value={String(value ?? "")}
          onSave={onSave}
          onCancel={onCancel}
          type="url"
        />
      );

    case "rating":
      return (
        <RatingEditor
          value={Number(value) || 0}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case "checkbox":
    case "formula":
    case "relation":
      return (
        <span className="text-xs text-surface-400 italic">Not editable</span>
      );

    default:
      return (
        <TextEditor
          value={String(value ?? "")}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
  }
}

function TextEditor({
  value,
  onSave,
  onCancel,
  type = "text",
}: {
  value: string;
  onSave: (v: unknown) => void;
  onCancel: () => void;
  type?: string;
}) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <input
      ref={ref}
      type={type}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave(text)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSave(text);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        e.stopPropagation();
      }}
      className="w-full text-sm bg-transparent border-none outline-none px-0 py-0"
    />
  );
}

function LongTextEditor({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <textarea
      ref={ref}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave(text)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        e.stopPropagation();
      }}
      className="w-full text-sm bg-transparent border-none outline-none px-0 py-0 min-h-[80px] resize-none"
    />
  );
}

function NumberEditor({
  value,
  precision,
  onSave,
  onCancel,
}: {
  value: unknown;
  precision?: number;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(
    value !== null && value !== undefined ? String(value) : ""
  );
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const step =
    precision !== undefined && precision > 0
      ? String(Math.pow(10, -precision))
      : "1";

  return (
    <input
      ref={ref}
      type="number"
      value={text}
      step={step}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const num = text === "" ? null : Number(text);
        onSave(num);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const num = text === "" ? null : Number(text);
          onSave(num);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        e.stopPropagation();
      }}
      className="w-full text-sm bg-transparent border-none outline-none px-0 py-0 text-right font-mono"
    />
  );
}

function SelectEditor({
  value,
  options,
  onSave,
  onCancel,
}: {
  value: string;
  options: { label: string; color: string }[];
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onCancel]);

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 z-30 w-48 bg-white border border-surface-200 rounded-lg shadow-lg py-1">
      <button
        onClick={() => onSave("")}
        className="w-full px-3 py-1.5 text-left text-sm text-surface-400 hover:bg-surface-50"
      >
        None
      </button>
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => onSave(opt.label)}
          className={`w-full px-3 py-1.5 text-left text-sm hover:bg-surface-50 flex items-center gap-2 ${
            value === opt.label ? "bg-brand-50" : ""
          }`}
        >
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: opt.color }}
          />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MultiSelectEditor({
  value,
  options,
  onSave,
  onCancel,
}: {
  value: string[];
  options: { label: string; color: string }[];
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onSave(selected);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onSave, selected]);

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );
  };

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 z-30 w-48 bg-white border border-surface-200 rounded-lg shadow-lg py-1">
      {options.map((opt) => {
        const checked = selected.includes(opt.label);
        return (
          <button
            key={opt.label}
            onClick={() => toggle(opt.label)}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface-50 flex items-center gap-2"
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                checked
                  ? "bg-brand-500 border-brand-500"
                  : "border-surface-300"
              }`}
            >
              {checked && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: opt.color }}
            />
            {opt.label}
          </button>
        );
      })}
      <div className="border-t border-surface-100 mt-1 pt-1">
        <button
          onClick={() => onSave(selected)}
          className="w-full px-3 py-1.5 text-left text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function DateEditor({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const dateVal = value
    ? new Date(value).toISOString().split("T")[0]
    : "";
  const [text, setText] = useState(dateVal);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <input
      ref={ref}
      type="date"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        if (e.target.value) {
          onSave(e.target.value);
        }
      }}
      onBlur={() => onSave(text || null)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        e.stopPropagation();
      }}
      className="w-full text-sm bg-transparent border-none outline-none px-0 py-0"
    />
  );
}

function RatingEditor({
  value,
  onSave,
  onCancel,
}: {
  value: number;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onSave(star === value ? 0 : star)}
          className={`text-lg transition-colors ${
            star <= value ? "text-amber-400" : "text-surface-300 hover:text-amber-300"
          }`}
        >
          {star <= value ? "\u2605" : "\u2606"}
        </button>
      ))}
    </div>
  );
}
