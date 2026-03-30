"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  Settings, Save, RefreshCw, AlertTriangle,
  Terminal, Variable, Server, RotateCcw,
  ChevronRight, Info,
} from "lucide-react";
import { toast } from "sonner";

interface StartupVariable {
  name: string;
  description: string;
  envVariable: string;
  defaultValue: string;
  serverValue: string;
  isEditable: boolean;
  rules: string;
}

type Tab = "general" | "startup" | "danger";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [serverName, setServerName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [saving, setSaving] = useState(false);
  const [variables, setVariables] = useState<StartupVariable[]>([]);
  const [loadingVars, setLoadingVars] = useState(false);
  const [showReinstall, setShowReinstall] = useState(false);
  const [reinstallConfirm, setReinstallConfirm] = useState("");
  const [reinstalling, setReinstalling] = useState(false);

  // Load server name
  useEffect(() => {
    // Placeholder: in production, fetch from API
    setServerName("Minecraft Server");
    setOriginalName("Minecraft Server");
  }, []);

  // Load startup variables
  const fetchVariables = useCallback(async () => {
    setLoadingVars(true);
    try {
      const res = await fetch("/api/server/startup");
      const data = await res.json();
      setVariables(data.variables ?? []);
    } catch {
      toast.error("Failed to load startup variables");
    } finally {
      setLoadingVars(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "startup") fetchVariables();
  }, [tab, fetchVariables]);

  const handleRename = async () => {
    if (!serverName.trim() || serverName === originalName) return;
    setSaving(true);
    try {
      await fetch("/api/server/settings/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: serverName.trim() }),
      });
      setOriginalName(serverName.trim());
      toast.success("Server renamed");
    } catch {
      toast.error("Failed to rename");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariable = async (envVar: string, value: string) => {
    try {
      await fetch("/api/server/startup/variable", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: envVar, value }),
      });
      toast.success(`Updated ${envVar}`);
      fetchVariables();
    } catch {
      toast.error("Failed to update variable");
    }
  };

  const handleReinstall = async () => {
    if (reinstallConfirm !== "REINSTALL") return;
    setReinstalling(true);
    try {
      await fetch("/api/server/settings/reinstall", { method: "POST" });
      toast.success("Server reinstallation started");
      setShowReinstall(false);
      setReinstallConfirm("");
    } catch {
      toast.error("Failed to reinstall");
    } finally {
      setReinstalling(false);
    }
  };

  const nameChanged = serverName !== originalName;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-tertiary mt-1">Server configuration and management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-overlay p-1 w-fit">
        {(["general", "startup", "danger"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "bg-elevated text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary",
              t === "danger" && tab === t && "text-accent-red",
            )}>
            {t === "general" && <Server className="h-4 w-4" />}
            {t === "startup" && <Variable className="h-4 w-4" />}
            {t === "danger" && <AlertTriangle className="h-4 w-4" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* General */}
      {tab === "general" && (
        <div className="space-y-6">
          <div className="dpx-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Server Name</h3>
            <div className="flex gap-3">
              <input value={serverName} onChange={(e) => setServerName(e.target.value)}
                className="flex-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue" />
              <Button variant="primary" disabled={!nameChanged || saving}
                leftIcon={saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                onClick={handleRename}>
                Save
              </Button>
            </div>
          </div>

          <div className="dpx-card p-6 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Server Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Server ID", value: process.env.NEXT_PUBLIC_SERVER_ID ?? "—" },
                { label: "Node", value: "node.devpilotx.com" },
                { label: "SFTP Host", value: "sftp://node.devpilotx.com:2022" },
                { label: "SFTP User", value: "admin.K0OwVd7y" },
              ].map((info) => (
                <div key={info.label}>
                  <span className="text-xs text-text-tertiary">{info.label}</span>
                  <p className="font-mono text-text-primary text-xs mt-0.5 break-all">{info.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Startup Variables */}
      {tab === "startup" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-tertiary">Configure server startup parameters</p>
            <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchVariables}>Refresh</Button>
          </div>

          {loadingVars ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="space-y-3">
              {variables.map((v) => (
                <div key={v.envVariable} className="dpx-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">{v.name}</span>
                        <Badge variant="default" className="font-mono text-[10px]">{v.envVariable}</Badge>
                        {!v.isEditable && <Badge variant="warning">Read-only</Badge>}
                      </div>
                      <p className="text-xs text-text-tertiary mt-1">{v.description}</p>
                      {v.rules && <p className="text-[10px] text-text-tertiary mt-0.5 font-mono">Rules: {v.rules}</p>}
                    </div>
                  </div>
                  <div className="mt-3">
                    <input
                      value={v.serverValue}
                      disabled={!v.isEditable}
                      onChange={(e) => {
                        setVariables((prev) =>
                          prev.map((x) => x.envVariable === v.envVariable ? { ...x, serverValue: e.target.value } : x),
                        );
                      }}
                      onBlur={() => {
                        if (v.isEditable) handleUpdateVariable(v.envVariable, v.serverValue);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && v.isEditable) handleUpdateVariable(v.envVariable, v.serverValue);
                      }}
                      placeholder={v.defaultValue}
                      className={cn(
                        "w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-mono text-text-primary focus:outline-none",
                        !v.isEditable && "opacity-50 cursor-not-allowed",
                        v.isEditable && "focus:border-accent-blue",
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      {tab === "danger" && (
        <div className="space-y-6">
          <div className="dpx-card border-accent-red/20 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-accent-red flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-accent-red">Reinstall Server</h3>
                <p className="text-xs text-text-tertiary mt-1">
                  This will stop your server, wipe all data, and reinstall it from scratch.
                  This action is irreversible — make a backup first.
                </p>
              </div>
            </div>
            <Button variant="danger" leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={() => setShowReinstall(true)}>
              Reinstall Server
            </Button>
          </div>
        </div>
      )}

      {/* Reinstall confirmation */}
      <Modal open={showReinstall} onClose={() => { setShowReinstall(false); setReinstallConfirm(""); }} title="Confirm Reinstall">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-accent-red/10 p-4">
            <AlertTriangle className="h-5 w-5 text-accent-red flex-shrink-0 mt-0.5" />
            <div className="text-sm text-accent-red">
              <strong>Warning:</strong> This will delete ALL server files and reinstall from scratch. This cannot be undone.
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Type <span className="font-mono font-bold text-accent-red">REINSTALL</span> to confirm
            </label>
            <input value={reinstallConfirm} onChange={(e) => setReinstallConfirm(e.target.value)}
              placeholder="REINSTALL"
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-mono text-text-primary focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowReinstall(false); setReinstallConfirm(""); }}>Cancel</Button>
            <Button variant="danger" disabled={reinstallConfirm !== "REINSTALL" || reinstalling} onClick={handleReinstall}>
              {reinstalling ? <Spinner size="sm" /> : "Confirm Reinstall"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}