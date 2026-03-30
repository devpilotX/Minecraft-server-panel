"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import {
  Puzzle, Upload, Trash2, RefreshCw, Search,
  ToggleLeft, ToggleRight, Download, FileArchive,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface PluginEntry {
  name: string;
  fileName: string;
  version?: string;
  enabled: boolean;
  size: string;
}

export default function AddonsPage() {
  const [plugins, setPlugins] = useState<PluginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server/files?path=/plugins");
      const data = await res.json();
      const items: PluginEntry[] = (data.files ?? [])
        .filter((f: any) => f.name.endsWith(".jar") || f.name.endsWith(".jar.disabled"))
        .map((f: any) => {
          const isDisabled = f.name.endsWith(".disabled");
          const cleanName = f.name.replace(".jar.disabled", "").replace(".jar", "");
          return {
            name: cleanName,
            fileName: f.name,
            enabled: !isDisabled,
            size: formatSize(f.size ?? 0),
          };
        })
        .sort((a: PluginEntry, b: PluginEntry) => a.name.localeCompare(b.name));
      setPlugins(items);
    } catch {
      toast.error("Failed to load plugins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlugins(); }, [fetchPlugins]);

  const togglePlugin = async (plugin: PluginEntry) => {
    const from = `/plugins/${plugin.fileName}`;
    const to = plugin.enabled
      ? `/plugins/${plugin.fileName}.disabled`
      : `/plugins/${plugin.fileName.replace(".disabled", "")}`;
    try {
      await fetch("/api/server/files/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });
      toast.success(`${plugin.name} ${plugin.enabled ? "disabled" : "enabled"}`);
      fetchPlugins();
    } catch {
      toast.error("Failed to toggle plugin");
    }
  };

  const deletePlugin = async (plugin: PluginEntry) => {
    if (!confirm(`Delete ${plugin.name}?`)) return;
    try {
      await fetch("/api/server/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [`/plugins/${plugin.fileName}`] }),
      });
      toast.success(`Deleted ${plugin.name}`);
      fetchPlugins();
    } catch {
      toast.error("Failed to delete plugin");
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch("/api/server/files/upload?path=/plugins", {
          method: "POST",
          body: formData,
        });
      }
      toast.success(`Uploaded ${files.length} plugin(s)`);
      fetchPlugins();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const filtered = plugins.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const enabledCount = plugins.filter((p) => p.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Addons & Plugins</h1>
          <p className="text-sm text-text-tertiary mt-1">
            {enabledCount} enabled · {plugins.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchPlugins}>Refresh</Button>
          <label>
            <Button variant="primary" size="sm" as="span" leftIcon={uploading ? <Spinner size="sm" /> : <Upload className="h-4 w-4" />}>
              Upload Plugin
            </Button>
            <input type="file" accept=".jar" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plugins…"
          className={cn("w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue")} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Puzzle className="h-10 w-10" />} title={search ? "No matching plugins" : "No Plugins Installed"} description="Upload .jar files to add plugins." />
      ) : (
        <div className="dpx-card divide-y divide-border-subtle overflow-hidden">
          {filtered.map((plugin) => (
            <div key={plugin.fileName} className="flex items-center justify-between px-4 py-3 hover:bg-overlay transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  plugin.enabled ? "bg-accent-green/10 text-accent-green" : "bg-overlay text-text-tertiary",
                )}>
                  <Puzzle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary truncate">{plugin.name}</span>
                    <Badge variant={plugin.enabled ? "success" : "default"}>{plugin.enabled ? "Enabled" : "Disabled"}</Badge>
                  </div>
                  <span className="text-[10px] text-text-tertiary">{plugin.fileName} · {plugin.size}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => togglePlugin(plugin)} title={plugin.enabled ? "Disable" : "Enable"}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-overlay text-text-tertiary hover:text-text-secondary">
                  {plugin.enabled ? <ToggleRight className="h-4 w-4 text-accent-green" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button onClick={() => deletePlugin(plugin)} title="Delete"
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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