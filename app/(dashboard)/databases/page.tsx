"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  Database, Plus, Trash2, RefreshCw, RotateCcw,
  Eye, EyeOff, Copy, Check, Key,
} from "lucide-react";
import { toast } from "sonner";

interface DBEntry {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  connectionsFrom: string;
  maxConnections: number;
}

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<DBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [dbName, setDbName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDatabases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server/databases");
      const data = await res.json();
      setDatabases(data.databases ?? []);
    } catch {
      toast.error("Failed to load databases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDatabases(); }, [fetchDatabases]);

  const handleCreate = async () => {
    if (!dbName.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/server/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database: dbName.trim(), remote: "%" }),
      });
      toast.success(`Database "${dbName}" created`);
      setDbName("");
      setShowCreate(false);
      fetchDatabases();
    } catch {
      toast.error("Failed to create database");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this database? This cannot be undone.")) return;
    try {
      await fetch(`/api/server/databases/${id}`, { method: "DELETE" });
      toast.success("Database deleted");
      fetchDatabases();
    } catch {
      toast.error("Failed to delete database");
    }
  };

  const handleRotatePassword = async (id: string) => {
    try {
      const res = await fetch(`/api/server/databases/${id}/rotate-password`, { method: "POST" });
      const data = await res.json();
      setPasswords((prev) => ({ ...prev, [id]: data.password ?? "" }));
      setShowPassword((prev) => ({ ...prev, [id]: true }));
      toast.success("Password rotated");
    } catch {
      toast.error("Failed to rotate password");
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
          <h1 className="text-2xl font-bold text-text-primary">Databases</h1>
          <p className="text-sm text-text-tertiary mt-1">{databases.length} database{databases.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchDatabases}>Refresh</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>New Database</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : databases.length === 0 ? (
        <EmptyState icon={<Database className="h-10 w-10" />} title="No Databases" description="Create a MySQL database for your plugins." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {databases.map((db) => (
            <div key={db.id} className="dpx-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-text-primary">{db.name}</span>
                    <p className="text-[10px] text-text-tertiary">{db.host}:{db.port}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(db.id)} title="Delete"
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Username</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-text-primary">{db.username}</span>
                    <button onClick={() => handleCopy(`user-${db.id}`, db.username)}
                      className="text-text-tertiary hover:text-text-secondary">
                      {copiedId === `user-${db.id}` ? <Check className="h-3 w-3 text-accent-green" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Password</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-text-primary">
                      {showPassword[db.id] && passwords[db.id]
                        ? passwords[db.id]
                        : "••••••••"}
                    </span>
                    <button onClick={() => setShowPassword((p) => ({ ...p, [db.id]: !p[db.id] }))}
                      className="text-text-tertiary hover:text-text-secondary">
                      {showPassword[db.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">JDBC</span>
                  <button onClick={() => handleCopy(`jdbc-${db.id}`, `jdbc:mysql://${db.host}:${db.port}/${db.name}`)}
                    className="flex items-center gap-1 font-mono text-accent-blue hover:underline">
                    jdbc:mysql://.../{db.name}
                    {copiedId === `jdbc-${db.id}` ? <Check className="h-3 w-3 text-accent-green" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="w-full" leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => handleRotatePassword(db.id)}>Rotate Password</Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Database">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">Database Name</label>
            <input value={dbName} onChange={(e) => setDbName(e.target.value)} placeholder="my_plugin_db"
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" disabled={!dbName.trim() || creating} onClick={handleCreate}>
              {creating ? <Spinner size="sm" /> : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}