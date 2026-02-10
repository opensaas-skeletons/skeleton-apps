import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode } from "react";

type ModalVariant = "info" | "success" | "error" | "destructive";

type ModalState =
  | { type: "alert"; message: string; variant: ModalVariant; resolve: () => void }
  | { type: "confirm"; message: string; variant: ModalVariant; confirmLabel: string; resolve: (v: boolean) => void }
  | { type: "prompt"; message: string; defaultValue: string; resolve: (v: string | null) => void };

interface ModalContextValue {
  alert: (opts: string | { message: string; variant?: ModalVariant }) => Promise<void>;
  confirm: (opts: string | { message: string; variant?: ModalVariant; confirmLabel?: string }) => Promise<boolean>;
  prompt: (opts: string | { message: string; defaultValue?: string }) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

function VariantIcon({ variant }: { variant: ModalVariant }) {
  if (variant === "success") {
    return (
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (variant === "error" || variant === "destructive") {
    return (
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

function AlertModal({ state, onClose }: { state: Extract<ModalState, { type: "alert" }>; onClose: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { btnRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="px-5 pt-5 pb-4 flex items-start gap-3">
          <VariantIcon variant={state.variant} />
          <p className="text-sm text-surface-700 whitespace-pre-wrap pt-1">{state.message}</p>
        </div>
        <div className="px-5 py-3 flex justify-end">
          <button ref={btnRef} onClick={onClose} className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ state, onClose }: { state: Extract<ModalState, { type: "confirm" }>; onClose: (v: boolean) => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { btnRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(false); }
      if (e.key === "Enter") { e.preventDefault(); onClose(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isDestructive = state.variant === "destructive";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose(false)} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="px-5 pt-5 pb-4 flex items-start gap-3">
          <VariantIcon variant={state.variant} />
          <p className="text-sm text-surface-700 whitespace-pre-wrap pt-1">{state.message}</p>
        </div>
        <div className="px-5 py-3 flex justify-end gap-2">
          <button onClick={() => onClose(false)} className="px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors">
            Cancel
          </button>
          <button ref={btnRef} onClick={() => onClose(true)} className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors ${isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"}`}>
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromptModal({ state, onClose }: { state: Extract<ModalState, { type: "prompt" }>; onClose: (v: string | null) => void }) {
  const [value, setValue] = useState(state.defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = () => { onClose(value || null); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose(null)} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="px-5 pt-5 pb-4">
          <p className="text-sm text-surface-700 whitespace-pre-wrap">{state.message}</p>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
            className="w-full px-3 py-2 text-sm border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 mt-3"
          />
        </div>
        <div className="px-5 py-3 flex justify-end gap-2">
          <button onClick={() => onClose(null)} className="px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-md transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ModalState[]>([]);
  const current = queue[0] ?? null;

  const dismiss = useCallback(() => {
    setQueue((q) => {
      const [first, ...rest] = q;
      if (first) {
        if (first.type === "alert") first.resolve();
        else if (first.type === "confirm") first.resolve(false);
        else if (first.type === "prompt") first.resolve(null);
      }
      return rest;
    });
  }, []);

  const alert = useCallback((opts: string | { message: string; variant?: ModalVariant }): Promise<void> => {
    const { message, variant = "info" } = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<void>((resolve) => {
      setQueue((q) => [...q, { type: "alert", message, variant, resolve }]);
    });
  }, []);

  const confirm = useCallback((opts: string | { message: string; variant?: ModalVariant; confirmLabel?: string }): Promise<boolean> => {
    const parsed = typeof opts === "string" ? { message: opts } : opts;
    const { message, variant = "info", confirmLabel = "Confirm" } = parsed;
    return new Promise<boolean>((resolve) => {
      setQueue((q) => [...q, { type: "confirm", message, variant, confirmLabel, resolve }]);
    });
  }, []);

  const prompt = useCallback((opts: string | { message: string; defaultValue?: string }): Promise<string | null> => {
    const parsed = typeof opts === "string" ? { message: opts } : opts;
    const { message, defaultValue = "" } = parsed;
    return new Promise<string | null>((resolve) => {
      setQueue((q) => [...q, { type: "prompt", message, defaultValue, resolve }]);
    });
  }, []);

  const handleAlertClose = useCallback(() => {
    setQueue((q) => {
      const [first, ...rest] = q;
      if (first?.type === "alert") first.resolve();
      return rest;
    });
  }, []);

  const handleConfirmClose = useCallback((value: boolean) => {
    setQueue((q) => {
      const [first, ...rest] = q;
      if (first?.type === "confirm") first.resolve(value);
      return rest;
    });
  }, []);

  const handlePromptClose = useCallback((value: string | null) => {
    setQueue((q) => {
      const [first, ...rest] = q;
      if (first?.type === "prompt") first.resolve(value);
      return rest;
    });
  }, []);

  return (
    <ModalContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      {current?.type === "alert" && <AlertModal state={current} onClose={handleAlertClose} />}
      {current?.type === "confirm" && <ConfirmModal state={current} onClose={handleConfirmClose} />}
      {current?.type === "prompt" && <PromptModal state={current} onClose={handlePromptClose} />}
    </ModalContext.Provider>
  );
}
