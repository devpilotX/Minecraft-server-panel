"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import {
  Save, RefreshCw, FileText, Settings, Search,
  AlertTriangle, RotateCcw, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ConfigFile {
  name: string;
  path: string;
  icon: React.ReactNode;
  description: string;
}

const CONFIG_FILES: ConfigFile[] = [
  { name: "server.properties", path: "/server.properties", icon: <Settings className="h-4 w-4" />, description: "Core server settings" },
  { name: "spigot.yml", path: "/spigot.yml", icon: <FileText className="h-4 w-4" />, description: "Spigot configuration" },
  { name: "bukkit.yml", path: "/bukkit.yml", icon: <FileText className="h-4 w-4" />, description: "Bukkit configuration" },
  { name: "paper.yml", path: "/paper.yml", icon: <FileText className="h-4 w-4" />, description: "Paper configuration" },
  { name: "purpur.yml", path: "/purpur.yml", icon: <FileText className="h-4 w-4" />, description: "Purpur configuration" },
  { name: "ops.json", path: "/ops.json", icon: <FileText className="h-4 w-4" />, description: "Server operators" },
  { name: "whitelist.json", path: "/whitelist.json", icon: <FileText className="h-4 w-4" />, description: "Whitelisted players" },
  { name: "banned-players.json", path: "/banned-players.json", icon: <FileText className="h-4 w-4" />, description: "Banned players list" },
];

interface PropertyEntry {
  key: string;
  value: string;
  comment?: string;
}

export default function ConfigPage() {
  const [selected, setSelected] = useState<ConfigFile>(CONFIG_FILES[0]);
  const [content, setContent] = useState("");
  const [original, setOriginal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<"visual" | "raw">("visual");
  const [properties, setProperties] = useState<PropertyEntry[]>([]);

  const isProperties = selected.name === "server.properties";
  const hasChanges = content !== original;

  const loadFile = useCallback(async (file: ConfigFile) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/server/files/read?path=${encodeURIComponent(file.path)}`);
      const data = await res.json();
      const text = data.content ?? "";
      setContent(text);
      setOriginal(text);
      if (file.name === "server.properties") {
        parseProperties(text);
      }
    } catch {
      toast.error(`Failed to load ${file.name}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFile(selected); }, [selected, loadFile]);

  const parseProperties = (text: string) => {
    const entries: PropertyEntry[] = [];
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || trimmed === "") {
        entries.push({ key: "", value: "", comment: trimmed });
      } else {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          entries.push({ key: trimmed.slice(0, eqIdx), value: trimmed.slice(eqIdx + 1) });
        }
      }
    }
    setProperties(entries);
  };

  const rebuildContent = (props: PropertyEntry[]): string => {
    return props
      .map((p) => (p.comment !== undefined ? p.comment : `${p.key}=${p.value}`))
      .join("\n");
  };

  const updateProperty = (idx: number, value: string) => {
    const next = [...properties];
    next[idx] = { ...next[idx], value };
    setProperties(next);
    setContent(rebuildContent(next));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/server/files/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selected.path, content }),
      });
      setOriginal(content);
      toast.success(`${selected.name} saved`);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setContent(original);
    if (isProperties) parseProperties(original);
    toast.info("Reverted to saved version");
  };

  const filteredProps = properties.filter(
    (p) =>
      p.comment !== undefined ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.value.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Configuration</h1>
          <p className="text-sm text-text-tertiary mt-1">Edit server configuration files</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleRevert}>Revert</Button>
          )}
          <Button variant="primary" size="sm" disabled={!hasChanges || saving} leftIcon={saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar — file list */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="dpx-card divide-y divide-border-subtle overflow-hidden">
            {CONFIG_FILES.map((file) => (
              <button
                key={file.path}
                onClick={() => { setSelected(file); setMode("visual"); setSearchTerm(""); }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors",
                  selected.path === file.path ? "bg-accent-blue/10 text-accent-blue" : "text-text-secondary hover:bg-overlay",
                )}
              >
                {file.icon}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium block truncate">{file.name}</span>
                  <span className="text-[10px] text-text-tertiary">{file.description}</span>
                </div>
                {selected.path === file.path && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="dpx-card overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{selected.name}</span>
                  {hasChanges && <Badge variant="warning">Unsaved</Badge>}
                </div>
                {isProperties && (
                  <div className="flex gap-1 rounded-md bg-overlay p-0.5">
                    {(["visual", "raw"] as const).map((m) => (
                      <button key={m} onClick={() => setMode(m)}
                        className={cn("rounded px-3 py-1 text-xs font-medium transition-colors",
                          mode === m ? "bg-elevated text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary",
                        )}>
                        {m === "visual" ? "Visual" : "Raw"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isProperties && mode === "visual" ? (
                <div className="divide-y divide-border-subtle">
                  {/* Search */}
                  <div className="px-4 py-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                      <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search properties…"
                        className="w-full rounded-md border border-border-subtle bg-surface py-1.5 pl-9 pr-3 text-sm text-text-primary focus:outline-none" />
                    </div>
                  </div>
                  {/* Property rows */}
                  <div className="max-h-[60vh] overflow-y-auto">
                    {filteredProps.map((p, i) => {
                      if (p.comment !== undefined) return null;
                      const origIdx = properties.indexOf(p);
                      return (
                        <div key={p.key} className="flex items-center gap-4 px-4 py-2.5 hover:bg-overlay transition-colors">
                          <span className="text-xs font-mono text-text-secondary w-1/2 truncate" title={p.key}>{p.key}</span>
                          <input
                            value={p.value}
                            onChange={(e) => updateProperty(origIdx, e.target.value)}
                            className="flex-1 rounded border border-border-subtle bg-surface px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-blue"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (isProperties) parseProperties(e.target.value);
                  }}
                  spellCheck={false}
                  className="w-full min-h-[60vh] bg-surface p-4 font-mono text-xs text-text-primary resize-none focus:outline-none"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}