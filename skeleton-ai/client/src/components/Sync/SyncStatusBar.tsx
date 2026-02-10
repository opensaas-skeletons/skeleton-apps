import { useState, useEffect } from "react";
import * as syncApi from "../../api/sync";

export default function SyncStatusBar() {
  const [syncing, setSyncing] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const status = await syncApi.getSyncStatus();
        if (mounted) {
          setSyncing(status.syncing);
          setLastSync(status.last_sync_at);
        }
      } catch {
        // Ignore errors
      }
    };
    check();
    const timer = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  if (syncing === 0 && !lastSync) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-surface-400">
      {syncing > 0 ? (
        <>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span>Syncing {syncing} repo{syncing > 1 ? "s" : ""}...</span>
        </>
      ) : lastSync ? (
        <>
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span>Synced</span>
        </>
      ) : null}
    </div>
  );
}
