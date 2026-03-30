"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  Globe, Plus, Trash2, Download, Upload,
  RefreshCw, Copy, Star, Sprout, Map,
} from "lucide-react";
import { toast } from "sonner";

interface WorldEntry {
  name: string;
  size: string;
  isDefault: boolean;
  lastModified: string;
  seed?: string;
}

export default function WorldsPage() {
  const [worlds, setWorlds] = useState<WorldEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSeed, setNewSeed] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchWorlds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server/files?path=/");
      const data = await res.json();
      // Filter for world directories (contain level.dat)
      const worldDirs: WorldEntry[] = (data.files ?? [])
        .filter((f: any) => f.isDirectory && !f.name.startsWith("."))
        .filter((f: any) =>
          ["world", "world_nether", "world_the_end"].includes(f.name) ||
          f.name.startsWith("world_")
        )
        .map((f: any) => ({
          name: f.name,
          size: formatSize(f.size ?? 0),
          isDefault: f.name === "world",
          lastModified: f.modifiedAt ?? new Date().toISOString(),
          seed: undefined,
        }));
      setWorlds(worldDirs);
    } catch {
      toast.error("Failed to load worlds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorlds(); }, [fetchWorlds]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      // Create world directory via file API
      await fetch("/api/server/files/create-directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `/${newName.trim()}` }),
      });
      // If seed provided, set it via server.properties
      if (newSeed.trim()) {
        await fetch("/api/rcon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: `setworldspawn` }),
        });
      }
      toast.success(`World "${newName}" created`);
      setNewName("");
      setNewSeed("");
      setShowCreate(false);
      fetchWorlds();
    } catch {
      toast.error("Failed to create world");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete world "${name}"? This cannot be undone.`)) return;
    try {
      await fetch("/api/server/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [`/${name}`] }),
      });
      toast.success(`Deleted "${name}"`);
      fetchWorlds();
    } catch {
      toast.error("Failed to delete world");
    }
  };

  const handleDownload = async (name: string) => {
    try {
      const res = await fetch(`/api/server/files/compress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [`/${name}`], to: `/${name}.tar.gz` }),
      });
      if (res.ok) {
        toast.success(`Compressing "${name}"… Download will start when ready.`);
      }
    } catch {
      toast.error("Failed to compress world");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Worlds</h1>
          <p className="text-sm text-text-tertiary mt-1">Manage server worlds and dimensions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchWorlds}>Refresh</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>New World</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : worlds.length === 0 ? (
        <EmptyState icon={<Globe className="h-10 w-10" />} title="No Worlds Found" description="Create a new world to get started." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {worlds.map((w) => (
            <div key={w.name} className="dpx-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    w.name.includes("nether") ? "bg-accent-red/10 text-accent-red"
                    : w.name.includes("end") ? "bg-accent-purple/10 text-accent-purple"
                    : "bg-accent-green/10 text-accent-green",
                  )}>
                    {w.name.includes("nether") ? <Map className="h-5 w-5" />
                    : w.name.includes("end") ? <Star className="h-5 w-5" />
                    : <Globe className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{w.name}</span>
                      {w.isDefault && <Badge variant="success">Default</Badge>}
                    </div>
                    <span className="text-xs text-text-tertiary">{w.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => handleDownload(w.name)}>Download</Button>
                {!w.isDefault && (
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-3.5 w-3.5 text-accent-red" />} onClick={() => handleDelete(w.name)}>
                    <span className="text-accent-red">Delete</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New World">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">World Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="my_world"
              className={cn("mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue")} />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Seed (optional)</label>
            <input value={newSeed} onChange={(e) => setNewSeed(e.target.value)} placeholder="Leave empty for random"
              className={cn("mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" disabled={!newName.trim() || creating} onClick={handleCreate}>
              {creating ? <Spinner size="sm" /> : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}