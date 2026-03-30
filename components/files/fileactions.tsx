"use client";

import { cn } from "@/lib/utils/cn";
import {
  Edit3, Trash2, Download, Copy, Scissors,
  Clipboard, FileArchive, FolderInput, Eye,
} from "lucide-react";

interface FileActionsProps {
  isOpen: boolean;
  position: { x: number; y: number };
  isDirectory: boolean;
  fileName: string;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onMove: () => void;
  onCompress: () => void;
  onOpen: () => void;
}

export function FileActions({
  isOpen, position, isDirectory, fileName,
  onClose, onRename, onDelete, onDownload,
  onCopy, onMove, onCompress, onOpen,
}: FileActionsProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        className="fixed z-50 min-w-48 rounded-lg border border-border-subtle bg-elevated p-1 shadow-card"
        style= left: position.x, top: position.y 
      >
        <MenuItem icon={<Eye className="h-3.5 w-3.5" />} label={isDirectory ? "Open" : "Edit"} onClick={() => { onOpen(); onClose(); }} />
        <MenuItem icon={<Edit3 className="h-3.5 w-3.5" />} label="Rename" onClick={() => { onRename(); onClose(); }} />
        <MenuItem icon={<Copy className="h-3.5 w-3.5" />} label="Copy" onClick={() => { onCopy(); onClose(); }} />
        <MenuItem icon={<Scissors className="h-3.5 w-3.5" />} label="Move" onClick={() => { onMove(); onClose(); }} />

        <div className="my-1 h-px bg-border-subtle" />

        {!isDirectory && (
          <MenuItem icon={<Download className="h-3.5 w-3.5" />} label="Download" onClick={() => { onDownload(); onClose(); }} />
        )}
        <MenuItem icon={<FileArchive className="h-3.5 w-3.5" />} label="Compress" onClick={() => { onCompress(); onClose(); }} />

        <div className="my-1 h-px bg-border-subtle" />

        <MenuItem icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" danger onClick={() => { onDelete(); onClose(); }} />
      </div>
    </>
  );
}

function MenuItem({ icon, label, danger, onClick }: {
  icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs transition-colors",
        danger
          ? "text-accent-red hover:bg-accent-red/10"
          : "text-text-secondary hover:bg-overlay hover:text-text-primary",
      )}
    >
      {icon}
      {label}
    </button>
  );
}