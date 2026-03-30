"use client";

import { useState } from "react";
import { type MinecraftPlayer } from "@/types/minecraft";
import { type PlayerAction } from "@/hooks/usePlayers";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import {
  Crown, Shield, ShieldOff, UserX, Ban,
  MessageSquare, Copy, Check, Globe, Wifi,
  ListPlus, ListMinus,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  player: MinecraftPlayer | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (a: PlayerAction) => void;
  isExecuting: boolean;
  isWhitelisted: boolean;
}

export function PlayerDetailModal({ player, isOpen, onClose, onAction, isExecuting, isWhitelisted }: Props) {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<"kick" | "ban" | "msg" | null>(null);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  if (!player) return null;

  const headUrl = player.uuid ? `https://crafatar.com/avatars/${player.uuid}?size=80&overlay` : null;
  const pingQ = player.ping < 50 ? { l: "Excellent", c: "text-accent-green", bg: "bg-accent-green/10" }
    : player.ping < 100 ? { l: "Good", c: "text-accent-blue", bg: "bg-accent-blue/10" }
    : player.ping < 200 ? { l: "Fair", c: "text-accent-orange", bg: "bg-accent-orange/10" }
    : { l: "Poor", c: "text-accent-red", bg: "bg-accent-red/10" };

  const handleCopy = async () => {
    if (!player.uuid) return;
    await navigator.clipboard.writeText(player.uuid);
    setCopied(true); toast.success("UUID copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setForm(null); setReason(""); setMsg(""); };

  return (
    <Modal open={isOpen} onClose={() => { reset(); onClose(); }} title={`Player: ${player.name}`} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0">
            {headUrl ? (
              <img src={headUrl} alt={player.name} width={80} height={80} className="rounded-xl" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-overlay text-2xl font-bold text-text-secondary">
                {player.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-text-primary">{player.name}</h3>
              {player.isOp && <Badge variant="warning"><Crown className="h-3 w-3 mr-1" />Operator</Badge>}
              {isWhitelisted && <Badge variant="success"><Shield className="h-3 w-3 mr-1" />Whitelisted</Badge>}
            </div>
            {player.uuid && (
              <button onClick={handleCopy} className="flex items-center gap-1.5 mt-1.5 group">
                <span className="text-xs font-mono text-text-tertiary group-hover:text-text-secondary">{player.uuid}</span>
                {copied ? <Check className="h-3 w-3 text-accent-green" /> : <Copy className="h-3 w-3 text-text-tertiary" />}
              </button>
            )}
            <div className="flex items-center gap-4 mt-3">
              <div className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", pingQ.bg, pingQ.c)}>
                <Wifi className="h-3 w-3" />{player.ping}ms — {pingQ.l}
              </div>
              {player.world && (
                <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Globe className="h-3 w-3" />{player.world}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ActBtn icon={<MessageSquare className="h-4 w-4" />} label="Message" c="text-accent-blue" bg="bg-accent-blue/10 hover:bg-accent-blue/20" onClick={() => { reset(); setForm("msg"); }} />
          <ActBtn icon={player.isOp ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />} label={player.isOp ? "Deop" : "Op"} c="text-accent-purple" bg="bg-accent-purple/10 hover:bg-accent-purple/20"
            onClick={() => onAction({ type: player.isOp ? "deop" : "op", player: player.name })} loading={isExecuting} />
          <ActBtn icon={isWhitelisted ? <ListMinus className="h-4 w-4" /> : <ListPlus className="h-4 w-4" />} label={isWhitelisted ? "Unwhitelist" : "Whitelist"} c="text-accent-green" bg="bg-accent-green/10 hover:bg-accent-green/20"
            onClick={() => onAction({ type: isWhitelisted ? "whitelist-remove" : "whitelist-add", player: player.name })} loading={isExecuting} />
          <ActBtn icon={<UserX className="h-4 w-4" />} label="Kick" c="text-accent-orange" bg="bg-accent-orange/10 hover:bg-accent-orange/20" onClick={() => { reset(); setForm("kick"); }} />
        </div>

        <Button variant="danger" className="w-full" leftIcon={<Ban className="h-4 w-4" />}
          onClick={() => { reset(); setForm("ban"); }}>Ban Player</Button>

        {/* Inline forms */}
        {form === "msg" && (
          <InlineForm label={`Message ${player.name}`} color="accent-blue" value={msg} onChange={setMsg}
            onSubmit={() => { onAction({ type: "msg", player: player.name, message: msg }); reset(); }}
            onCancel={reset} submitLabel="Send" disabled={!msg.trim() || isExecuting} />
        )}
        {form === "kick" && (
          <InlineForm label={`Kick ${player.name}`} color="accent-orange" value={reason} onChange={setReason}
            placeholder="Reason (optional)"
            onSubmit={() => { onAction({ type: "kick", player: player.name, reason: reason || undefined }); reset(); }}
            onCancel={reset} submitLabel="Confirm Kick" submitVariant="warning" disabled={isExecuting} />
        )}
        {form === "ban" && (
          <InlineForm label={`Ban ${player.name}`} color="accent-red" value={reason} onChange={setReason}
            placeholder="Reason (optional)"
            onSubmit={() => { onAction({ type: "ban", player: player.name, reason: reason || undefined }); reset(); }}
            onCancel={reset} submitLabel="Confirm Ban" submitVariant="danger" disabled={isExecuting} />
        )}
      </div>
    </Modal>
  );
}

function ActBtn({ icon, label, c, bg, onClick, loading }: {
  icon: React.ReactNode; label: string; c: string; bg: string; onClick: () => void; loading?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className={cn("flex flex-col items-center gap-1.5 rounded-xl p-3 border border-border-subtle transition-all", bg, c, "disabled:opacity-50")}>
      {icon}<span className="text-\[11px\] font-semibold">{label}</span>
    </button>
  );
}

function InlineForm({ label, color, value, onChange, onSubmit, onCancel, submitLabel, submitVariant, placeholder, disabled }: {
  label: string; color: string; value: string; onChange: (v: string) => void;
  onSubmit: () => void; onCancel: () => void; submitLabel: string;
  submitVariant?: "primary" | "warning" | "danger"; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className={cn("dpx-card p-4 space-y-3 border-${color}/20")}>
      <label className={`text-sm font-medium text-${color}`}>{label}</label>
      <input autoFocus value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !disabled) onSubmit(); }}
        placeholder={placeholder ?? "Type your message…"}
        className={cn(
          "w-full rounded-lg border border-border-subtle bg-surface px-3 py-2",
          "text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none",
        )} />
      <div className="flex gap-2">
        <Button variant={submitVariant ?? "primary"} size="sm" disabled={disabled} onClick={onSubmit}>{submitLabel}</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}