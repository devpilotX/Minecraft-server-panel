"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  Users, Plus, Trash2, RefreshCw, Edit3,
  Shield, Mail, Check,
} from "lucide-react";
import { toast } from "sonner";

const PERMISSION_GROUPS: Record<string, string[]> = {
  Control: ["control.console", "control.start", "control.stop", "control.restart"],
  "User Management": ["user.create", "user.read", "user.update", "user.delete"],
  "File Management": ["file.create", "file.read", "file.read-content", "file.update", "file.delete", "file.archive", "file.sftp"],
  Backup: ["backup.create", "backup.read", "backup.delete", "backup.download", "backup.restore"],
  Database: ["database.create", "database.read", "database.update", "database.delete", "database.view_password"],
  Schedule: ["schedule.create", "schedule.read", "schedule.update", "schedule.delete"],
  Settings: ["settings.rename", "settings.reinstall"],
  Allocation: ["allocation.read", "allocation.create", "allocation.update", "allocation.delete"],
};

interface Subuser {
  uuid: string;
  username: string;
  email: string;
  image: string;
  twoFactorEnabled: boolean;
  permissions: string[];
  createdAt: string;
}

export default function SubusersPage() {
  const [subusers, setSubusers] = useState<Subuser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState<Subuser | null>(null);
  const [email, setEmail] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchSubusers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server/subusers");
      const data = await res.json();
      setSubusers(data.subusers ?? []);
    } catch {
      toast.error("Failed to load subusers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubusers(); }, [fetchSubusers]);

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const toggleGroup = (perms: string[]) => {
    const allSelected = perms.every((p) => selectedPerms.includes(p));
    if (allSelected) {
      setSelectedPerms((prev) => prev.filter((p) => !perms.includes(p)));
    } else {
      setSelectedPerms((prev) => [...new Set([...prev, ...perms])]);
    }
  };

  const handleCreate = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/server/subusers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), permissions: selectedPerms }),
      });
      toast.success("Subuser invited");
      setShowCreate(false);
      setEmail("");
      setSelectedPerms([]);
      fetchSubusers();
    } catch {
      toast.error("Failed to create subuser");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await fetch(`/api/server/subusers/${editUser.uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selectedPerms }),
      });
      toast.success("Permissions updated");
      setShowEdit(false);
      setEditUser(null);
      fetchSubusers();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Remove this subuser?")) return;
    try {
      await fetch(`/api/server/subusers/${uuid}`, { method: "DELETE" });
      toast.success("Subuser removed");
      fetchSubusers();
    } catch {
      toast.error("Failed to remove");
    }
  };

  const openEdit = (user: Subuser) => {
    setEditUser(user);
    setSelectedPerms([...user.permissions]);
    setShowEdit(true);
  };

  const PermissionsGrid = () => (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto">
      {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
        const allSelected = perms.every((p) => selectedPerms.includes(p));
        return (
          <div key={group}>
            <button onClick={() => toggleGroup(perms)} className="flex items-center gap-2 mb-2">
              <div className={cn("flex h-4 w-4 items-center justify-center rounded border",
                allSelected ? "border-accent-blue bg-accent-blue text-white" : "border-border-subtle",
              )}>
                {allSelected && <Check className="h-3 w-3" />}
              </div>
              <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">{group}</span>
            </button>
            <div className="grid grid-cols-2 gap-1 pl-6">
              {perms.map((perm) => (
                <label key={perm} className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" checked={selectedPerms.includes(perm)}
                    onChange={() => togglePerm(perm)} className="h-3.5 w-3.5 rounded" />
                  <span className="text-xs text-text-secondary">{perm.split(".").pop()}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Subusers</h1>
          <p className="text-sm text-text-tertiary mt-1">Manage access for other users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchSubusers}>Refresh</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setShowCreate(true); setSelectedPerms([]); }}>Invite User</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : subusers.length === 0 ? (
        <EmptyState icon={<Users className="h-10 w-10" />} title="No Subusers" description="Invite users to share server access with specific permissions." />
      ) : (
        <div className="dpx-card divide-y divide-border-subtle overflow-hidden">
          {subusers.map((u) => (
            <div key={u.uuid} className="flex items-center justify-between px-5 py-4 hover:bg-overlay transition-colors group">
              <div className="flex items-center gap-4">
                <img src={u.image || `https://ui-avatars.com/api/?name=${u.username}&background=1a1a2e&color=e0e0ff&bold=true`}
                  alt={u.username} className="h-10 w-10 rounded-full" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{u.username}</span>
                    {u.twoFactorEnabled && <Badge variant="success">2FA</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                    <Mail className="h-3 w-3" />{u.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">{u.permissions.length} perms</Badge>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(u)} title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-overlay text-text-tertiary">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(u.uuid)} title="Remove"
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Invite Subuser" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">Email Address</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" type="email"
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Permissions</label>
            <div className="mt-2"><PermissionsGrid /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" disabled={!email.trim() || saving} onClick={handleCreate}>
              {saving ? <Spinner size="sm" /> : "Invite"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit: ${editUser?.username}`} size="lg">
        <div className="space-y-4">
          <PermissionsGrid />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={handleUpdate}>
              {saving ? <Spinner size="sm" /> : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}