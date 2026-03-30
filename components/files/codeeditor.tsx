"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { type FileItem } from "@/hooks/useFileManager";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  Save,
  X,
  Download,
  RotateCcw,
  WrapText,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface CodeEditorProps {
  file: FileItem;
  content: string;
  isSaving: boolean;
  onSave: (path: string, content: string) => void;
  onClose: () => void;
  onDownload: (path: string) => void;
}

const LANGUAGE_MAP: Record<string, string> = {
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  properties: "properties",
  cfg: "ini",
  conf: "ini",
  ini: "ini",
  toml: "toml",
  xml: "xml",
  html: "html",
  css: "css",
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  bash: "bash",
  md: "markdown",
  txt: "text",
  log: "text",
  sk: "text",
};

/**
 * Lightweight code editor with line numbers, search, word wrap,
 * and keyboard shortcuts (Ctrl+S to save, Ctrl+F to search).
 *
 * For a full Monaco editor experience, install @monaco-editor/react
 * and replace this component.
 */
export function CodeEditor({
  file,
  content: initialContent,
  isSaving,
  onSave,
  onClose,
  onDownload,
}: CodeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [wordWrap, setWordWrap] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState(13);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasChanges = content !== initialContent;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const language = LANGUAGE_MAP[ext] ?? "text";
  const lineCount = content.split("\n").length;

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) onSave(file.key, content);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch((s) => !s);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, content, file.key, onSave]);

  // Update content if file changes externally
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return (
    <div className="dpx-card flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text-primary truncate max-w-60">
            {file.name}
          </span>
          <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-mono text-text-tertiary">
            {language}
          </span>
          {hasChanges && (
            <span className="h-2 w-2 rounded-full bg-accent-orange" title="Unsaved changes" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Font size */}
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <button
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              className="text-text-tertiary hover:text-text-secondary text-xs px-1"
            >
              A-
            </button>
            <span className="text-[10px] text-text-tertiary w-6 text-center">
              {fontSize}
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(20, s + 1))}
              className="text-text-tertiary hover:text-text-secondary text-xs px-1"
            >
              A+
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowSearch((s) => !s)}
            title="Search (Ctrl+F)"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setWordWrap((w) => !w)}
            title="Toggle word wrap"
            className={wordWrap ? "text-accent-blue" : ""}
          >
            <WrapText className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setContent(initialContent)}
            disabled={!hasChanges}
            title="Revert changes"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDownload(file.key)}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-border-subtle mx-1" />

          <Button
            variant="primary"
            size="sm"
            onClick={() => onSave(file.key, content)}
            disabled={!hasChanges || isSaving}
            leftIcon={
              isSaving ? <Spinner size="sm" /> : <Save className="h-3.5 w-3.5" />
            }
          >
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            title="Close editor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle bg-surface/50">
          <Search className="h-3.5 w-3.5 text-text-tertiary" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in file..."
            className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-tertiary"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowSearch(false);
                setSearchQuery("");
              }
            }}
          />
          {searchQuery && (
            <span className="text-[10px] text-text-tertiary">
              {(content.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) ?? []).length} matches
            </span>
          )}
        </div>
      )}

      {/* Editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Line numbers */}
        <div className="flex-shrink-0 select-none border-r border-border-subtle bg-surface/30 px-3 py-3 overflow-hidden">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className="text-right font-mono text-text-tertiary leading-relaxed"
              style= fontSize: fontSize - 1 
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={cn(
            "flex-1 resize-none bg-transparent p-3 font-mono text-text-primary leading-relaxed",
            "outline-none selection:bg-accent-blue/20",
            !wordWrap && "whitespace-pre overflow-x-auto",
            wordWrap && "whitespace-pre-wrap break-words",
          )}
          style= fontSize, tabSize: 2 
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border-subtle text-[10px] text-text-tertiary">
        <span>{lineCount} lines</span>
        <div className="flex items-center gap-3">
          <span>{formatFileSize(new Blob([content]).size)}</span>
          <span>UTF-8</span>
          <span>{language}</span>
          <kbd className="rounded border border-border-subtle px-1 py-0.5 text-[9px]">
            Ctrl+S save
          </kbd>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}