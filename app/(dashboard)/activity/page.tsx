"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import {
  Activity, RefreshCw, Search, Filter,
  Terminal, Power, Upload, Trash2, UserPlus,
  Shield, Database, Clock, Settings, Archive,
  Key, Globe, Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface ActivityEntry {
  id: string;
  event: string;
  ip: string | null;
  description: string | null;
  properties: Record<string, unknown>;
  hasAdditionalMetadata: boolean;
  timestamp: string;
  actor?: { uuid: string; email: string };
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  "server:console.command": <Terminal className="h-4 w-4" />,
  "server:power": <Power className="h-4 w-4" />,
  "server:backup": <Archive className="h-4 w-4" />,
  "server:file": <Upload className="h-4 w-4" />,
  "server:database": <Database className="h-4 w-4" />,
  "server:settings": <Settings className="h-4 w-4" />,
  "server:subuser": <UserPlus className="h-4 w-4" />,
  "server:allocation": <Globe className="h-4 w-4" />,
  "server:schedule": <Calendar className="h-4 w-4" />,
  "server:startup": <Key className="h-4 w-4" />,
};

function getEventIcon(event: string): React.ReactNode {
  for (const [prefix, icon] of Object.entries(EVENT_ICONS)) {
    if (event.startsWith(prefix)) return icon;
  }
  return <Activity className="h-4 w-4" />;
}

function getEventColor(event: string): string {
  if (event.includes("delete") || event.includes("kill")) return "bg-accent-red/10 text-accent-red";
  if (event.includes("create") || event.includes("start")) return "bg-accent-green/10 text-accent-green";
  if (event.includes("update") || event.includes("restart")) return "bg-accent-blue/10 text-accent-blue";
  return "bg-overlay text-text-tertiary";
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server/activity");
      const data = await res.json();
      setEntries(data.activities ?? []);
    } catch {
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const filtered = entries.filter(
    (e) =>
      e.event.toLowerCase().includes(search.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.actor?.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const groupByDate = (items: ActivityEntry[]) => {
    const groups: Record<string, ActivityEntry[]> = {};
    for (const item of items) {
      const date = new Date(item.timestamp).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    }
    return groups;
  };

  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Activity Log</h1>
          <p className="text-sm text-text-tertiary mt-1">Track all server actions and events</p>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchActivity}>Refresh</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter events..."
          className={cn("w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue")} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Activity className="h-10 w-10" />} title={search ? "No matching events" : "No Activity"} description="Server activity will appear here." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">{date}</h3>
              <div className="dpx-card divide-y divide-border-subtle overflow-hidden">
                {items.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-4 px-4 py-3 hover:bg-overlay transition-colors">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg mt-0.5 flex-shrink-0", getEventColor(entry.event))}>
                      {getEventIcon(entry.event)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{entry.event.replace("server:", "").replace(/\./g, " › ")}</span>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-text-tertiary mt-0.5 truncate">{entry.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        {entry.actor?.email && (
                          <span>{entry.actor.email}</span>
                        )}
                        {entry.ip && <span className="font-mono">{entry.ip}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}