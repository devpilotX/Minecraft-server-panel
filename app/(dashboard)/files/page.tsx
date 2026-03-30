"use client";

import { useEffect, useState } from "react";
import { useFileManager } from "@/hooks/useFileManager";
import { FileExplorer } from "@/components/files/FileExplorer";
import { FileBreadcrumb } from "@/components/files/FileBreadcrumb";
import { CodeEditor } from "@/components/files/CodeEditor";
import { FileUpload } from "@/components/files/FileUpload";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import {
  FolderOpen,
  FilePlus,
  FolderPlus,
  Upload,
  Trash2,
  CheckSquare,
  XSquare,
  RefreshCw,
} from "lucide-react";

/**
 * File Manager page.
 * Full file explorer with breadcrumb navigation, code editor,
 * drag-and-drop upload, and file CRUD operations.
 */
export default function FilesPage() {
  const fm = useFileManager();
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemIsDir, setNewItemIsDir] = useState(false);

  // Load files on mount
  useEffect(() => {
    fm.listFiles("/");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateItem = () => {
    if (newItemName.trim()) {
      fm.createItem(newItemName.trim(), newItemIsDir);
      setNewItemName("");
      setShowNewFileDialog(false);
    }
  };

  // If editing a file, show the code editor
  if (fm.editingFile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-text-secondary" />
          <h1 className="text-2xl font-bold text-text-primary">File Manager</h1>
        </div>
        <FileBreadcrumb
          currentPath={fm.editingFile.key}
          onNavigate={() => fm.closeEditor()}
        />
        <CodeEditor
          file={fm.editingFile}
          content={fm.editingContent}
          isSaving={fm.isSaving}
          onSave={fm.saveFile}
          onClose={fm.closeEditor}
          onDownload={fm.downloadFile}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-text-secondary" />
            <h1 className="text-2xl font-bold text-text-primary">
              File Manager
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Browse, edit, and manage server files
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dpx-card p-3 flex flex-wrap items-center gap-2">
        {/* Breadcrumb */}
        <div className="flex-1 min-w-0">
          <FileBreadcrumb
            currentPath={fm.currentPath}
            onNavigate={fm.navigateTo}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {fm.selectedFiles.size > 0 && (
            <>
              <span className="text-xs text-text-tertiary mr-1">
                {fm.selectedFiles.size} selected
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  fm.deleteItems(Array.from(fm.selectedFiles).map((k) => {
                    const f = fm.files.find((f) => f.key === k);
                    return f?.name ?? k;
                  }));
                }}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={fm.clearSelection}
                title="Clear selection"
              >
                <XSquare className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fm.selectAll}
            title="Select all"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => fm.listFiles(fm.currentPath)}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-border-subtle" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNewItemIsDir(false);
              setShowNewFileDialog(true);
            }}
            leftIcon={<FilePlus className="h-3.5 w-3.5" />}
          >
            New File
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNewItemIsDir(true);
              setShowNewFileDialog(true);
            }}
            leftIcon={<FolderPlus className="h-3.5 w-3.5" />}
          >
            New Folder
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUpload((s) => !s)}
            leftIcon={<Upload className="h-3.5 w-3.5" />}
          >
            Upload
          </Button>
        </div>
      </div>

      {/* New file/folder dialog */}
      {showNewFileDialog && (
        <div className="dpx-card p-4 flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            {newItemIsDir ? "New folder:" : "New file:"}
          </span>
          <input
            autoFocus
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateItem();
              if (e.key === "Escape") {
                setShowNewFileDialog(false);
                setNewItemName("");
              }
            }}
            placeholder={newItemIsDir ? "folder-name" : "filename.txt"}
            className={cn(
              "flex-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5",
              "text-sm text-text-primary placeholder:text-text-tertiary",
              "focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30",
            )}
          />
          <Button variant="primary" size="sm" onClick={handleCreateItem}>
            Create
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowNewFileDialog(false);
              setNewItemName("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Upload zone */}
      {showUpload && (
        <FileUpload
          onUpload={fm.uploadFiles}
          currentPath={fm.currentPath}
        />
      )}

      {/* File explorer */}
      <FileExplorer
        files={fm.files}
        isLoading={fm.isLoading}
        selectedFiles={fm.selectedFiles}
        onOpenFile={(file) => fm.readFile(file)}
        onOpenFolder={(path) => fm.navigateTo(path)}
        onToggleSelect={fm.toggleSelection}
        onRename={fm.renameItem}
        onDelete={fm.deleteItems}
        onDownload={fm.downloadFile}
      />
    </div>
  );
}