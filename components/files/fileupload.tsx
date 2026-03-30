"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Upload, X, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatBytes } from "@/lib/utils/formatters";

interface FileUploadProps {
  onUpload: (files: FileList | File[]) => Promise<void>;
  currentPath: string;
}

/**
 * Drag-and-drop file upload zone with file preview list.
 */
export function FileUpload({ onUpload, currentPath }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      setPendingFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setPendingFiles(Array.from(e.target.files));
      }
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    if (pendingFiles.length === 0) return;
    setIsUploading(true);
    try {
      await onUpload(pendingFiles);
      setPendingFiles([]);
    } finally {
      setIsUploading(false);
    }
  }, [pendingFiles, onUpload]);

  const removeFile = useCallback((index: number) => {
    setPendingFiles((files) => files.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "dpx-card flex flex-col items-center justify-center gap-3 p-8 cursor-pointer",
          "border-2 border-dashed transition-all",
          isDragging
            ? "border-accent-blue bg-accent-blue/5"
            : "border-border-subtle hover:border-border-default hover:bg-overlay/50",
        )}
      >
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
            isDragging
              ? "bg-accent-blue/10 text-accent-blue"
              : "bg-surface text-text-tertiary",
          )}
        >
          <Upload className="h-6 w-6" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            {isDragging ? "Drop files here" : "Drag & drop files to upload"}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            or click to browse • uploading to{" "}
            <span className="font-mono text-text-secondary">{currentPath}</span>
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Pending files list */}
      {pendingFiles.length > 0 && (
        <div className="dpx-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">
              {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} ready
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingFiles([])}
                disabled={isUploading}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpload}
                disabled={isUploading}
                leftIcon={
                  isUploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )
                }
              >
                {isUploading ? "Uploading..." : "Upload All"}
              </Button>
            </div>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {pendingFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2"
              >
                <FileIcon className="h-4 w-4 text-text-tertiary flex-shrink-0" />
                <span className="flex-1 text-xs text-text-primary truncate">
                  {file.name}
                </span>
                <span className="text-[10px] text-text-tertiary">
                  {formatBytes(file.size)}
                </span>
                <button
                  onClick={() => removeFile(i)}
                  disabled={isUploading}
                  className="text-text-tertiary hover:text-accent-red transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}