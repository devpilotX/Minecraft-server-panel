"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  Clock, Plus, Trash2, RefreshCw, Play,
  Pause, Edit3, CalendarClock, Zap, Terminal,
  Power, Archive, ToggleRight, ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduleTask {
  id: string;
  sequenceId: number;
  action: "command" | "power" | "backup";
  payload: string;
  timeOffset: number;
  isQueued: boolean;
}

interface Schedule {
  id: string;
  name: string;
  isActive: boolean;
  isProcessing: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  cron: { minute: string; hour: string; dayOfMonth: string; month: string; dayOfWeek: string };
  tasks: ScheduleTask[];
}

const CRON_PRESETS = [
  { label: "Every hour", value: { minute: "0", hour: "*", dayOfMonth: "*", month: "*", dayOfWeek: "*" } },
  { label: "Every 6 hours", value: { minute: "0", hour: "*/6", dayOfMonth: "*", month: "*", dayOfWeek: "*" } },
  { label: "Daily at midnight", value: { minute: "0", hour: "0", dayOfMonth: "*", month: "*", dayOfWeek: "*" } },
  { label: "Daily at 6 AM", value: { minute: "0", hour: "6", dayOfMonth: "*", month: "*", dayOfWeek: "*" } },
  { label: "Weekly (Sunday)", value: { minute: "0", hour: "0", dayOfMonth: "*", month: "*", dayOfWeek: "0" } },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCron, setFormCron] = useState({ minute: "0", hour: "*", dayOfMonth: "*", month: "*", dayOfWeek: "*" });
  const [formActive, setFormActive] = useState(true);

  // Task form
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskAction, setTaskAction] = useState<"command" | "power" | "backup">("command");
  const [taskPayload, setTaskPayload] = useState("");
  const [taskOffset, setTaskOffset] = useState(0);
  const [taskScheduleId, setTaskScheduleId] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server/schedules");
      const data = await res.json();
      setSchedules(data.schedules ?? []);
    } catch {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/server/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, isActive: formActive, ...formCron }),
      });
      toast.success(`Schedule "${formName}" created`);
      resetForm();
      setShowCreate(false);
      fetchSchedules();
    } catch {
      toast.error("Failed to create schedule");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await fetch(`/api/server/schedules/${id}`, { method: "DELETE" });
      toast.success("Schedule deleted");
      fetchSchedules();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (schedule: Schedule) => {
    try {
      await fetch(`/api/server/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !schedule.isActive }),
      });
      toast.success(schedule.isActive ? "Schedule paused" : "Schedule activated");
      fetchSchedules();
    } catch {
      toast.error("Failed to toggle schedule");
    }
  };

  const handleExecute = async (id: string) => {
    try {
      await fetch(`/api/server/schedules/${id}/execute`, { method: "POST" });
      toast.success("Schedule executed");
      setTimeout(fetchSchedules, 2000);
    } catch {
      toast.error("Failed to execute");
    }
  };

  const handleAddTask = async () => {
    if (!taskScheduleId) return;
    try {
      await fetch(`/api/server/schedules/${taskScheduleId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: taskAction, payload: taskPayload, timeOffset: taskOffset }),
      });
      toast.success("Task added");
      setShowAddTask(false);
      setTaskPayload("");
      setTaskOffset(0);
      fetchSchedules();
    } catch {
      toast.error("Failed to add task");
    }
  };

  const handleDeleteTask = async (scheduleId: string, taskId: string) => {
    try {
      await fetch(`/api/server/schedules/${scheduleId}/tasks/${taskId}`, { method: "DELETE" });
      toast.success("Task removed");
      fetchSchedules();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormCron({ minute: "0", hour: "*", dayOfMonth: "*", month: "*", dayOfWeek: "*" });
    setFormActive(true);
  };

  const cronString = (c: Schedule["cron"]) => `${c.minute} ${c.hour} ${c.dayOfMonth} ${c.month} ${c.dayOfWeek}`;

  const taskIcon = (action: string) => {
    switch (action) {
      case "command": return <Terminal className="h-3.5 w-3.5" />;
      case "power": return <Power className="h-3.5 w-3.5" />;
      case "backup": return <Archive className="h-3.5 w-3.5" />;
      default: return <Zap className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Schedules</h1>
          <p className="text-sm text-text-tertiary mt-1">Automate tasks with cron-based scheduling</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchSchedules}>Refresh</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>New Schedule</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : schedules.length === 0 ? (
        <EmptyState icon={<CalendarClock className="h-10 w-10" />} title="No Schedules" description="Create automated tasks like backups, restarts, and commands." />
      ) : (
        <div className="space-y-4">
          {schedules.map((s) => (
            <div key={s.id} className="dpx-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    s.isActive ? "bg-accent-green/10 text-accent-green" : "bg-overlay text-text-tertiary",
                  )}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary truncate">{s.name}</span>
                      <Badge variant={s.isActive ? "success" : "default"}>{s.isActive ? "Active" : "Paused"}</Badge>
                      {s.isProcessing && <Badge variant="info">Running</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-text-tertiary mt-0.5">
                      <span className="font-mono">{cronString(s.cron)}</span>
                      {s.nextRunAt && <span>Next: {new Date(s.nextRunAt).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggle(s)} title={s.isActive ? "Pause" : "Activate"}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-overlay text-text-tertiary">
                    {s.isActive ? <ToggleRight className="h-4 w-4 text-accent-green" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button onClick={() => handleExecute(s.id)} title="Run now"
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-overlay text-text-tertiary hover:text-accent-blue">
                    <Play className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} title="Delete"
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              {s.tasks.length > 0 && (
                <div className="border-t border-border-subtle">
                  {s.tasks.sort((a, b) => a.sequenceId - b.sequenceId).map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-overlay transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-overlay text-text-tertiary">
                          {taskIcon(t.action)}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-text-primary">
                            {t.action === "command" ? t.payload : t.action === "power" ? `Power: ${t.payload}` : "Create backup"}
                          </span>
                          {t.timeOffset > 0 && (
                            <span className="text-[10px] text-text-tertiary ml-2">+{t.timeOffset}s delay</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteTask(s.id, t.id)}
                        className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-accent-red">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add task button */}
              <div className="border-t border-border-subtle px-5 py-2">
                <button onClick={() => { setTaskScheduleId(s.id); setShowAddTask(true); }}
                  className="text-xs font-medium text-accent-blue hover:underline flex items-center gap-1">
                  <Plus className="h-3 w-3" />Add task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Schedule Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="Create Schedule">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">Schedule Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Nightly Backup"
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Presets</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CRON_PRESETS.map((p) => (
                <button key={p.label} onClick={() => setFormCron(p.value)}
                  className="rounded-md border border-border-subtle px-3 py-1 text-xs text-text-secondary hover:bg-overlay hover:text-text-primary transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {(["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] as const).map((field) => (
              <div key={field}>
                <label className="text-[10px] font-medium text-text-tertiary uppercase">{field.replace(/([A-Z])/g, " $1")}</label>
                <input value={formCron[field]} onChange={(e) => setFormCron((c) => ({ ...c, [field]: e.target.value }))}
                  className="mt-0.5 w-full rounded border border-border-subtle bg-surface px-2 py-1 text-xs font-mono text-text-primary focus:outline-none" />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="h-4 w-4 rounded" />
            <span className="text-sm text-text-primary">Activate immediately</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" disabled={!formName.trim() || creating} onClick={handleCreate}>
              {creating ? <Spinner size="sm" /> : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal open={showAddTask} onClose={() => setShowAddTask(false)} title="Add Task">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">Action</label>
            <div className="flex gap-2 mt-1">
              {(["command", "power", "backup"] as const).map((a) => (
                <button key={a} onClick={() => setTaskAction(a)}
                  className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    taskAction === a ? "border-accent-blue bg-accent-blue/10 text-accent-blue" : "border-border-subtle text-text-secondary hover:bg-overlay",
                  )}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {taskAction !== "backup" && (
            <div>
              <label className="text-sm font-medium text-text-secondary">
                {taskAction === "command" ? "Command" : "Power Action (start/stop/restart/kill)"}
              </label>
              <input value={taskPayload} onChange={(e) => setTaskPayload(e.target.value)}
                placeholder={taskAction === "command" ? "say Server restarting..." : "restart"}
                className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-text-secondary">Time Offset (seconds)</label>
            <input type="number" value={taskOffset} onChange={(e) => setTaskOffset(parseInt(e.target.value) || 0)} min={0}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none" />
            <p className="text-[10px] text-text-tertiary mt-1">Delay after previous task completes</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddTask(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddTask}>Add Task</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}