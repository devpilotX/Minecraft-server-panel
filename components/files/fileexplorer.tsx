"use client";

import { useState, useCallback } from "react";
import { type FileItem } from "@/hooks/useFileManager";
import { cn } from "@/lib/utils/cn";
import { formatBytes, formatRelativeTime } from "@/lib/utils/formatters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  File,
  Folder,
  FileText,
  FileCode,
  FileJson,
  Image as ImageIcon,
  Archive,
  Settings,
  MoreHorizontal,
  Download,
  Pencil,
  Trash2,
  Copy,
  FolderOpen,
  Check,
} from "lucide-react";

interface FileExplorerProps {
  files: FileItem[];
  isLoading: boolean;
  selectedFiles: Set<string>;
  onOpenFile: (file: FileItem) => void;
  onOpenFolder: (path: string) => void;
  onToggleSelect: (key: string) => void;
  onRename: (from: string, to: string) => void;
  onDelete: (paths: string[]) => void;
  onDownload: (path: string) => void;
}

/* ========== FILE ICON MAPPING ========== */

function getFileIcon(file: FileItem) {
  if (!file.isFile) return <Folder className="h-5 w-5 text-accent-blue" />;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  const iconMap: Record<string, React.ReactNode> = {
    json: <FileJson className="h-5 w-5 text-yellow-400" />,
    yml: <FileCode className="h-5 w-5 text-accent-purple" />,
    yaml: <FileCode className="h-5 w-5 text-accent-purple" />,
    properties: <Settings className="h-5 w-5 text-accent-orange" />,
    cfg: <Settings className="h-5 w-5 text-accent-orange" />,
    conf: <Settings className="h-5 w-5 text-accent-orange" />,
    toml: <Settings className="h-5 w-5 text-accent-orange" />,
    ini: <Settings className="h-5 w-5 text-accent-orange" />,
    js: <FileCode className="h-5 w-5 text-yellow-300" />,
    ts: <FileCode className="h-5 w-5 text-accent-blue" />,
    sh: <FileCode className="h-5 w-5 text-accent-green" />,
    log: <FileText className="h-5 w-5 text-text-tertiary" />,
    txt: <FileText className="h-5 w-5 text-text-tertiary" />,
    md: <FileText className="h-5 w-5 text-text-secondary" />,
    jar: <Archive className="h-5 w-5 text-accent-red" />,
    zip: <Archive className="h-5 w-5 text-accent-orange" />,
    gz: <Archive className="h-5 w-5 text-accent-orange" />,
    tar: <Archive className="h-5 w-5 text-accent-orange" />,
    png: <ImageIcon className="h-5 w-5 text-accent-green" />,
    jpg: <ImageIcon className="h-5 w-5 text-accent-green" />,
    gif: <ImageIcon className="h-5 w-5 text-accent-green" />,
    sk: <FileCode className="h-5 w-5 text-accent-purple" />,
  };

  return iconMap[ext] ?? <File className="h-5 w-5 text-text-tertiary" />;
}

/**
 * File explorer table with selection, context menus, and inline rename.
 */
export function FileExplorer({
  files,
  isLoading,
  selectedFiles,
  onOpenFile,
  onOpenFolder,
  onToggleSelect,
  onRename,
  onDelete,
  onDownload,
}: FileExplorerProps) {
  const [contextMenu, setContextMenu] = useState<{
    file: FileItem;
    x: number;
    y: number;
  } | null>(null);
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string[] | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, file: FileItem) => {
      e.preventDefault();
      setContextMenu({ file, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleRenameSubmit = useCallback(
    (oldName: string) => {
      if (renameValue && renameValue !== oldName) {
        onRename(oldName, renameValue);
      }
      setRenamingKey(null);
      setRenameValue("");
    },
    [renameValue, onRename],
  );

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen className="h-10 w-10" />}
        title="Empty Directory"
        description="This folder has no files or subdirectories."
      />
    );
  }

  return (
    <>
      {/* File list */}
      <div className="dpx-card divide-y divide-border-subtle overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          <div className="col-span-1" />
          <div className="col-span-5">Name</div>
          <div className="col-span-2 hidden sm:block">Size</div>
          <div className="col-span-3 hidden md:block">Modified</div>
          <div className="col-span-1" />
        </div>

        {/* Rows */}
        {files.map((file) => (
          <div
            key={file.key}
            className={cn(
              "grid grid-cols-12 gap-2 items-center px-4 py-2.5 cursor-pointer",
              "hover:bg-overlay transition-colors group",
              selectedFiles.has(file.key) && "bg-accent-blue/5",
            )}
            onClick={() => {
              if (file.isFile) {
                if (file.isEditable) onOpenFile(file);
                else onDownload(file.key);
              } else {
                onOpenFolder(file.key);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, file)}
          >
            {/* Checkbox */}
            <div className="col-span-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(file.key);
                }}
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                  selectedFiles.has(file.key)
                    ? "border-accent-blue bg-accent-blue text-white"
                    : "border-border-subtle opacity-0 group-hover:opacity-100",
                )}
              >
                {selectedFiles.has(file.key) && (
                  <Check className="h-3 w-3" />
                )}
              </button>
            </div>

            {/* Name + icon */}
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              {getFileIcon(file)}
              {renamingKey === file.key ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(file.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit(file.name);
                    if (e.key === "Escape") {
                      setRenamingKey(null);
                      setRenameValue("");
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent text-sm text-text-primary border-b border-accent-blue outline-none font-medium"
                />
              ) : (
                <span className="text-sm font-medium text-text-primary truncate">
                  {file.name}
                </span>
              )}
            </div>

            {/* Size */}
            <div className="col-span-2 hidden sm:block">
              <span className="text-xs text-text-tertiary">
                {file.isFile ? formatBytes(file.size) : "—"}
              </span>
            </div>

            {/* Modified */}
            <div className="col-span-3 hidden md:block">
              <span className="text-xs text-text-tertiary">
                {file.modifiedAt ? formatRelativeTime(file.modifiedAt) : "—"}
              </span>
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, file);
                }}
                className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-overlay hover:text-text-secondary transition-all"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 min-w-44 rounded-lg border border-border-subtle bg-elevated p-1 shadow-card"
            style= left: contextMenu.x, top: contextMenu.y 
          >
            {contextMenu.file.isFile && contextMenu.file.isEditable && (
              <ContextMenuItem
                icon={<Pencil className="h-3.5 w-3.5" />}
                label="Edit"
                onClick={() => {
                  onOpenFile(contextMenu.file);
                  setContextMenu(null);
                }}
              />
            )}
            <ContextMenuItem
              icon={<Copy className="h-3.5 w-3.5" />}
              label="Rename"
              onClick={() => {
                setRenamingKey(contextMenu.file.key);
                setRenameValue(contextMenu.file.name);
                setContextMenu(null);
              }}
            />
            {contextMenu.file.isFile && (
              <ContextMenuItem
                icon={<Download className="h-3.5 w-3.5" />}
                label="Download"
                onClick={() => {
                  onDownload(contextMenu.file.key);
                  setContextMenu(null);
                }}
              />
            )}
            <div className="my-1 h-px bg-border-subtle" />
            <ContextMenuItem
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Delete"
              danger
              onClick={() => {
                setDeleteConfirm([contextMenu.file.name]);
                setContextMenu(null);
              }}
            />
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          open
          title="Delete files"
          description={`Are you sure you want to delete ${deleteConfirm.length} item(s)? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            onDelete(deleteConfirm);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}

/* ========== CONTEXT MENU ITEM ========== */

function ContextMenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
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