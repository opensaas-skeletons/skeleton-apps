export default function IngestionProgress() {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-3.5 h-3.5 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs text-yellow-700 font-medium">Ingesting...</span>
      </div>
      <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full animate-pulse" style={{ width: "60%" }} />
      </div>
    </div>
  );
}
