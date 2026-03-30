"use client";

import { cn } from "@/lib/utils/cn";
import { formatBytes, formatDate } from "@/lib/utils/formatters";
import {
  File, Folder, FileText, FileCode, FileImage,
  FileArchive, MoreHorizontal,
} from "lucide-react";

interface FileRowProps {
  name: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const EXT_ICONS: Record<string, React.ReactNode> = {
  ts: <FileCode className="h-4 w-4 text-accent-blue" />,
  tsx: <FileCode className="h-4 w-4 text-accent-blue" />,
  js: <FileCode className="h-4 w-4 text-accent-orange" />,
  jsx: <FileCode className="h-4 w-4 text-accent-orange" />,
  json: <FileCode className="h-4 w-4 text-accent-green" />,
  yml: <FileText className="h-4 w-4 text-accent-purple" />,
  yaml: <FileText className="h-4 w-4 text-accent-purple" />,
  properties: <FileText className="h-4 w-4 text-accent-purple" />,
  md: <FileText className="h-4 w-4 text-text-secondary" />,
  txt: <FileText className="h-4 w-4 text-text-secondary" />,
  log: <FileText className="h-4 w-4 text-text-tertiary" />,
  png: <FileImage className="h-4 w-4 text-accent-green" />,
  jpg: <FileImage className="h-4 w-4 text-accent-green" />,
  gif: <FileImage className="h-4 w-4 text-accent-green" />,
  jar: <FileArchive className="h-4 w-4 text-accent-red" />,
  zip: <FileArchive className="h-4 w-4 text-accent-orange" />,
  "tar.gz": <FileArchive className="h-4 w-4 text-accent-orange" />,
};

function getIcon(name: string, isDir: boolean) {
  if (isDir) return <Folder className="h-4 w-4 text-accent-blue" />;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_ICONS[ext] ?? <File className="h-4 w-4 text-text-tertiary" />;
}

export function FileRow({
  name, isDirectory, size, modifiedAt,
  isSelected, onSelect, onOpen, onContextMenu,
}: FileRowProps) {
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      className={cn(
        "grid grid-cols-12 gap-2 items-center px-4 py-2 cursor-pointer transition-colors",
        "hover:bg-overlay",
        isSelected && "bg-accent-blue/10 hover:bg-accent-blue/15",
      )}
    >
      {/* Name */}
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        {getIcon(name, isDirectory)}
        <span className={cn(
          "text-sm truncate",
          isDirectory ? "font-semibold text-text-primary" : "text-text-secondary",
        )}>
          {name}
        </span>
      </div>

      {/* Size */}
      <div className="col-span-3 hidden sm:block">
        <span className="text-xs text-text-tertiary">
          {isDirectory ? "—" : formatBytes(size)}
        </span>
      </div>

      {/* Modified */}
      <div className="col-span-3 hidden md:flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          {formatDate(modifiedAt)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onContextMenu(e); }}
          className="flex h-6 w-6 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-overlay text-text-tertiary"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}