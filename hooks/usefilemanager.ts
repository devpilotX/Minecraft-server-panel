"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "sonner";

export interface FileItem {
  key: string; // unique path key
  name: string;
  mode: string; // "file" | "dir"
  size: number; // bytes
  isFile: boolean;
  isSymlink: boolean;
  mimetype: string;
  createdAt: string;
  modifiedAt: string;
  isEditable: boolean;
}

export interface FileManagerState {
  files: FileItem[];
  currentPath: string;
  isLoading: boolean;
  error: string | null;
  selectedFiles: Set<string>;
  editingFile: FileItem | null;
  editingContent: string;
  isSaving: boolean;
}

const EDITABLE_EXTENSIONS = [
  ".txt", ".yml", ".yaml", ".json", ".properties", ".cfg",
  ".conf", ".ini", ".log", ".sh", ".bash", ".toml",
  ".xml", ".html", ".css", ".js", ".ts", ".md",
  ".env", ".gitignore", ".dockerignore", ".sk",
];

function isEditable(name: string): boolean {
  const lower = name.toLowerCase();
  return EDITABLE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * File manager hook. Manages file listing, navigation, CRUD operations,
 * and file editing state via the Pterodactyl API proxy.
 */
export function useFileManager() {
  const serverId = useAppStore((s) => s.server.serverId);
  const [state, setState] = useState<FileManagerState>({
    files: [],
    currentPath: "/",
    isLoading: false,
    error: null,
    selectedFiles: new Set(),
    editingFile: null,
    editingContent: "",
    isSaving: false,
  });

  const apiBase = `/api/pterodactyl/servers/${serverId}/files`;

  /* ========== LIST FILES ========== */
  const listFiles = useCallback(
    async (path: string = "/") => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const res = await fetch(
          `${apiBase}/list?directory=${encodeURIComponent(path)}`,
        );
        if (!res.ok) throw new Error(`Failed to list files (${res.status})`);

        const data = await res.json();
        const files: FileItem[] = (data.data ?? data).map(
          (f: any) => ({
            key: `${path === "/" ? "" : path}/${f.attributes?.name ?? f.name}`,
            name: f.attributes?.name ?? f.name,
            mode: f.attributes?.mode ?? f.mode,
            size: f.attributes?.size ?? f.size ?? 0,
            isFile: (f.attributes?.is_file ?? f.is_file) === true,
            isSymlink: (f.attributes?.is_symlink ?? f.is_symlink) === false,
            mimetype: f.attributes?.mimetype ?? f.mimetype ?? "",
            createdAt: f.attributes?.created_at ?? f.created_at ?? "",
            modifiedAt: f.attributes?.modified_at ?? f.modified_at ?? "",
            isEditable: (f.attributes?.is_file ?? f.is_file) && isEditable(f.attributes?.name ?? f.name),
          }),
        );

        // Sort: directories first, then alphabetically
        files.sort((a, b) => {
          if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
          return a.name.localeCompare(b.name);
        });

        setState((s) => ({
          ...s,
          files,
          currentPath: path,
          isLoading: false,
          selectedFiles: new Set(),
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load files";
        setState((s) => ({ ...s, isLoading: false, error: msg }));
        toast.error(msg);
      }
    },
    [apiBase],
  );

  /* ========== NAVIGATE ========== */
  const navigateTo = useCallback(
    (path: string) => {
      listFiles(path);
    },
    [listFiles],
  );

  const navigateUp = useCallback(() => {
    const parts = state.currentPath.split("/").filter(Boolean);
    parts.pop();
    navigateTo("/" + parts.join("/"));
  }, [state.currentPath, navigateTo]);

  /* ========== READ FILE ========== */
  const readFile = useCallback(
    async (file: FileItem) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const res = await fetch(
          `${apiBase}/contents?file=${encodeURIComponent(file.key)}`,
        );
        if (!res.ok) throw new Error(`Failed to read file (${res.status})`);

        const content = await res.text();
        setState((s) => ({
          ...s,
          editingFile: file,
          editingContent: content,
          isLoading: false,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to read file";
        setState((s) => ({ ...s, isLoading: false }));
        toast.error(msg);
      }
    },
    [apiBase],
  );

  /* ========== SAVE FILE ========== */
  const saveFile = useCallback(
    async (path: string, content: string) => {
      setState((s) => ({ ...s, isSaving: true }));
      try {
        const res = await fetch(
          `${apiBase}/write?file=${encodeURIComponent(path)}`,
          {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: content,
          },
        );
        if (!res.ok) throw new Error(`Failed to save file (${res.status})`);

        setState((s) => ({ ...s, isSaving: false, editingContent: content }));
        toast.success("File saved");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save file";
        setState((s) => ({ ...s, isSaving: false }));
        toast.error(msg);
      }
    },
    [apiBase],
  );

  /* ========== CREATE FILE/FOLDER ========== */
  const createItem = useCallback(
    async (name: string, isDirectory: boolean) => {
      try {
        const endpoint = isDirectory ? "create-folder" : "write";
        const path = `${state.currentPath === "/" ? "" : state.currentPath}/${name}`;

        if (isDirectory) {
          const res = await fetch(`${apiBase}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              root: state.currentPath,
              name,
            }),
          });
          if (!res.ok) throw new Error(`Failed to create folder (${res.status})`);
        } else {
          const res = await fetch(
            `${apiBase}/write?file=${encodeURIComponent(path)}`,
            {
              method: "POST",
              headers: { "Content-Type": "text/plain" },
              body: "",
            },
          );
          if (!res.ok) throw new Error(`Failed to create file (${res.status})`);
        }

        toast.success(`${isDirectory ? "Folder" : "File"} created: ${name}`);
        await listFiles(state.currentPath);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Create failed";
        toast.error(msg);
      }
    },
    [apiBase, state.currentPath, listFiles],
  );

  /* ========== RENAME ========== */
  const renameItem = useCallback(
    async (from: string, to: string) => {
      try {
        const res = await fetch(`${apiBase}/rename`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            root: state.currentPath,
            files: [{ from: from, to: to }],
          }),
        });
        if (!res.ok) throw new Error(`Rename failed (${res.status})`);

        toast.success(`Renamed to ${to}`);
        await listFiles(state.currentPath);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Rename failed";
        toast.error(msg);
      }
    },
    [apiBase, state.currentPath, listFiles],
  );

  /* ========== DELETE ========== */
  const deleteItems = useCallback(
    async (paths: string[]) => {
      try {
        const res = await fetch(`${apiBase}/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            root: state.currentPath,
            files: paths,
          }),
        });
        if (!res.ok) throw new Error(`Delete failed (${res.status})`);

        toast.success(
          `Deleted ${paths.length} item${paths.length > 1 ? "s" : ""}`,
        );
        await listFiles(state.currentPath);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Delete failed";
        toast.error(msg);
      }
    },
    [apiBase, state.currentPath, listFiles],
  );

  /* ========== DOWNLOAD ========== */
  const downloadFile = useCallback(
    async (path: string) => {
      try {
        const res = await fetch(
          `${apiBase}/download?file=${encodeURIComponent(path)}`,
        );
        if (!res.ok) throw new Error(`Download failed (${res.status})`);

        const data = await res.json();
        const downloadUrl = data.attributes?.url ?? data.url;

        if (downloadUrl) {
          window.open(downloadUrl, "_blank");
          toast.success("Download started");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Download failed";
        toast.error(msg);
      }
    },
    [apiBase],
  );

  /* ========== UPLOAD ========== */
  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      try {
        // Get upload URL
        const urlRes = await fetch(`${apiBase}/upload`);
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        const { attributes } = await urlRes.json();
        const uploadUrl = attributes?.url;

        if (!uploadUrl) throw new Error("No upload URL returned");

        const formData = new FormData();
        for (const file of Array.from(files)) {
          formData.append("files", file);
        }

        const uploadRes = await fetch(
          `${uploadUrl}&directory=${encodeURIComponent(state.currentPath)}`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

        toast.success(
          `Uploaded ${files.length} file${files.length > 1 ? "s" : ""}`,
        );
        await listFiles(state.currentPath);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        toast.error(msg);
      }
    },
    [apiBase, state.currentPath, listFiles],
  );

  /* ========== SELECTION ========== */
  const toggleSelection = useCallback((key: string) => {
    setState((s) => {
      const next = new Set(s.selectedFiles);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...s, selectedFiles: next };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState((s) => ({
      ...s,
      selectedFiles: new Set(s.files.map((f) => f.key)),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((s) => ({ ...s, selectedFiles: new Set() }));
  }, []);

  const closeEditor = useCallback(() => {
    setState((s) => ({ ...s, editingFile: null, editingContent: "" }));
  }, []);

  return {
    ...state,
    listFiles,
    navigateTo,
    navigateUp,
    readFile,
    saveFile,
    createItem,
    renameItem,
    deleteItems,
    downloadFile,
    uploadFiles,
    toggleSelection,
    selectAll,
    clearSelection,
    closeEditor,
  };
}