"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  Archive, Plus, Download, RotateCcw, Trash2,
  RefreshCw, Lock, Clock, HardDrive, CheckCircle2,
  AlertCircle, Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Backup {
  uuid: string;
  name: string;
  bytes: number;
  checksum: string | null;
  isSuccessful: boolean;
  isLocked: boolean;
  createdAt: string;
  completedAt: string | null;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [backupLocked, setBackupLocked] = useState(false);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server/backups");
      const data = await res.json();
      setBackups(data.backups ?? []);
    } catch {
      toast.error("Failed to load backups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await fetch("/api/server/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: backupName || undefined, isLocked: backupLocked }),
      });
      toast.success("Backup creation started");
      setShowCreate(false);
      setBackupName("");
      setBackupLocked(false);
      setTimeout(fetchBackups, 2000);
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (uuid: string) => {
    if (!confirm("Restore this backup? Current server data will be overwritten.")) return;
    try {
      await fetch(`/api/server/backups/${uuid}/restore`, { method: "POST" });
      toast.success("Backup restore started");
    } catch {
      toast.error("Failed to restore");
    }
  };

  const handleDownload = async (uuid: string) => {
    try {
      const res = await fetch(`/api/server/backups/${uuid}/download`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to get download link");
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Delete this backup permanently?")) return;
    try {
      await fetch(`/api/server/backups/${uuid}`, { method: "DELETE" });
      toast.success("Backup deleted");
      fetchBackups();
    } catch {
      toast.error("Failed to delete backup");
    }
  };

  const handleToggleLock = async (uuid: string, locked: boolean) => {
    try {
      await fetch(`/api/server/backups/${uuid}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !locked }),
      });
      toast.success(locked ? "Backup unlocked" : "Backup locked");
      fetchBackups();
    } catch {
      toast.error("Failed to update lock");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Backups</h1>
          <p className="text-sm text-text-tertiary mt-1">{backups.length} backup{backups.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchBackups}>Refresh</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Create Backup</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : backups.length === 0 ? (
        <EmptyState icon={<Archive className="h-10 w-10" />} title="No Backups" description="Create your first backup to protect your server data." />
      ) : (
        <div className="dpx-card divide-y divide-border-subtle overflow-hidden">
          {backups.map((b) => (
            <div key={b.uuid} className="flex items-center justify-between px-4 py-4 hover:bg-overlay transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  b.isSuccessful ? "bg-accent-green/10 text-accent-green" : b.completedAt ? "bg-accent-red/10 text-accent-red" : "bg-accent-blue/10 text-accent-blue",
                )}>
                  {!b.completedAt ? <Loader2 className="h-5 w-5 animate-spin" /> : b.isSuccessful ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary truncate">{b.name || "Unnamed Backup"}</span>
                    {b.isLocked && <Lock className="h-3 w-3 text-accent-orange" />}
                    {!b.completedAt && <Badge variant="info">In progress</Badge>}
                    {b.completedAt && !b.isSuccessful && <Badge variant="danger">Failed</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text-tertiary mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(b.createdAt).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{formatSize(b.bytes)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggleLock(b.uuid, b.isLocked)} title={b.isLocked ? "Unlock" : "Lock"}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-overlay text-text-tertiary">
                  <Lock className={cn("h-4 w-4", b.isLocked && "text-accent-orange")} />
                </button>
                {b.isSuccessful && (
                  <>
                    <button onClick={() => handleDownload(b.uuid)} title="Download"
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-overlay text-text-tertiary hover:text-accent-blue">
                      <Download className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleRestore(b.uuid)} title="Restore"
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-overlay text-text-tertiary hover:text-accent-green">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </>
                )}
                {!b.isLocked && (
                  <button onClick={() => handleDelete(b.uuid)} title="Delete"
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Backup">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">Backup Name (optional)</label>
            <input value={backupName} onChange={(e) => setBackupName(e.target.value)} placeholder="e.g. Before plugin update"
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={backupLocked} onChange={(e) => setBackupLocked(e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle text-accent-blue focus:ring-accent-blue" />
            <div>
              <span className="text-sm font-medium text-text-primary">Lock backup</span>
              <p className="text-xs text-text-tertiary">Locked backups cannot be deleted automatically.</p>
            </div>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" disabled={creating} onClick={handleCreate}>
              {creating ? <Spinner size="sm" /> : "Create Backup"}
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