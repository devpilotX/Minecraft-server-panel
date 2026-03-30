"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import {
  Network, Plus, Trash2, RefreshCw, Star,
  Copy, Check, Edit3, Globe, Wifi,
} from "lucide-react";
import { toast } from "sonner";

interface Allocation {
  id: string;
  ip: string;
  port: number;
  alias: string | null;
  notes: string | null;
  isDefault: boolean;
}

export default function NetworkPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server/network");
      const data = await res.json();
      setAllocations(data.allocations ?? []);
    } catch {
      toast.error("Failed to load allocations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

  const handleSetPrimary = async (id: string) => {
    try {
      await fetch(`/api/server/network/${id}/primary`, { method: "POST" });
      toast.success("Primary allocation updated");
      fetchAllocations();
    } catch {
      toast.error("Failed to set primary");
    }
  };

  const handleSetNote = async (id: string) => {
    try {
      await fetch(`/api/server/network/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText }),
      });
      toast.success("Note updated");
      setEditingNote(null);
      fetchAllocations();
    } catch {
      toast.error("Failed to update note");
    }
  };

  const handleUnassign = async (id: string) => {
    if (!confirm("Remove this allocation?")) return;
    try {
      await fetch(`/api/server/network/${id}`, { method: "DELETE" });
      toast.success("Allocation removed");
      fetchAllocations();
    } catch {
      toast.error("Failed to remove allocation");
    }
  };

  const handleAssign = async () => {
    try {
      await fetch("/api/server/network", { method: "POST" });
      toast.success("New allocation assigned");
      fetchAllocations();
    } catch {
      toast.error("Failed to assign allocation");
    }
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Network</h1>
          <p className="text-sm text-text-tertiary mt-1">Manage port allocations and network settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchAllocations}>Refresh</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAssign}>New Allocation</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : allocations.length === 0 ? (
        <EmptyState icon={<Network className="h-10 w-10" />} title="No Allocations" description="Request a new port allocation." />
      ) : (
        <div className="dpx-card divide-y divide-border-subtle overflow-hidden">
          {allocations.map((a) => {
            const address = `${a.ip}:${a.port}`;
            return (
              <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-overlay transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    a.isDefault ? "bg-accent-blue/10 text-accent-blue" : "bg-overlay text-text-tertiary",
                  )}>
                    {a.isDefault ? <Star className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleCopy(a.id, address)} className="flex items-center gap-1.5 group/copy">
                        <span className="text-sm font-mono font-semibold text-text-primary">{address}</span>
                        {copiedId === a.id
                          ? <Check className="h-3 w-3 text-accent-green" />
                          : <Copy className="h-3 w-3 text-text-tertiary opacity-0 group-hover/copy:opacity-100" />}
                      </button>
                      {a.isDefault && <Badge variant="info">Primary</Badge>}
                      {a.alias && <Badge variant="default">{a.alias}</Badge>}
                    </div>
                    {editingNote === a.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSetNote(a.id); if (e.key === "Escape") setEditingNote(null); }}
                          className="rounded border border-border-subtle bg-surface px-2 py-0.5 text-xs text-text-primary focus:outline-none w-48" />
                        <Button variant="primary" size="sm" onClick={() => handleSetNote(a.id)}>Save</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingNote(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingNote(a.id); setNoteText(a.notes ?? ""); }}
                        className="text-[10px] text-text-tertiary hover:text-text-secondary flex items-center gap-1 mt-0.5">
                        {a.notes || "Add note..."}
                        <Edit3 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!a.isDefault && (
                    <>
                      <button onClick={() => handleSetPrimary(a.id)} title="Set as primary"
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-overlay text-text-tertiary hover:text-accent-blue">
                        <Star className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleUnassign(a.id)} title="Remove"
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}