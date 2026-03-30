import { pteroClient } from "@/lib/api/pterodactyl";
import { FileListResponseSchema } from "@/lib/api/types";
import type {
  FileListParams,
  FileWriteParams,
  FileRenameParams,
  FileDeleteParams,
  FileCompressParams,
  FileDecompressParams,
  CreateFolderParams,
  FileObject,
} from "@/lib/api/types";

const SERVER_ID =
  process.env["NEXT_PUBLIC_DEFAULT_SERVER_ID"] ?? "";

/**
 * Lists files in a directory.
 * Validates response with Zod schema.
 */
export async function listFiles(
  params: FileListParams,
  serverId: string = SERVER_ID,
): Promise<FileObject[]> {
  const response = await pteroClient.get(
    `/servers/${serverId}/files/list`,
    { params: { directory: params.directory } },
  );
  const validated = FileListResponseSchema.parse(response.data);
  return validated.data.map((item) => item.attributes);
}

/**
 * Gets the content of a file as a string.
 */
export async function getFileContent(
  filePath: string,
  serverId: string = SERVER_ID,
): Promise<string> {
  const response = await pteroClient.get<string>(
    `/servers/${serverId}/files/contents`,
    {
      params: { file: filePath },
      responseType: "text",
    },
  );
  return response.data;
}

/**
 * Writes content to a file (create or overwrite).
 */
export async function writeFile(
  params: FileWriteParams,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.post(
    `/servers/${serverId}/files/write`,
    params.content,
    {
      params: { file: params.path },
      headers: { "Content-Type": "text/plain" },
    },
  );
}

/**
 * Renames or moves files.
 */
export async function renameFiles(
  params: FileRenameParams,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.put(
    `/servers/${serverId}/files/rename`,
    {
      root: params.root,
      files: params.files,
    },
  );
}

/**
 * Deletes files or folders.
 */
export async function deleteFiles(
  params: FileDeleteParams,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.post(
    `/servers/${serverId}/files/delete`,
    {
      root: params.root,
      files: params.files,
    },
  );
}

/**
 * Creates a new folder.
 */
export async function createFolder(
  params: CreateFolderParams,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.post(
    `/servers/${serverId}/files/create-folder`,
    {
      root: params.root,
      name: params.name,
    },
  );
}

/**
 * Compresses files/folders into a zip archive.
 * Returns the name of the created archive.
 */
export async function compressFiles(
  params: FileCompressParams,
  serverId: string = SERVER_ID,
): Promise<string> {
  const response = await pteroClient.post<{
    object: string;
    attributes: { name: string };
  }>(
    `/servers/${serverId}/files/compress`,
    {
      root: params.root,
      files: params.files,
    },
  );
  return response.data.attributes.name;
}

/**
 * Decompresses a zip archive.
 */
export async function decompressFile(
  params: FileDecompressParams,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.post(
    `/servers/${serverId}/files/decompress`,
    {
      root: params.root,
      file: params.file,
    },
  );
}

/**
 * Gets a signed URL for downloading a file.
 */
export async function getFileDownloadUrl(
  filePath: string,
  serverId: string = SERVER_ID,
): Promise<string> {
  const response = await pteroClient.get<{
    attributes: { url: string };
  }>(
    `/servers/${serverId}/files/download`,
    { params: { file: filePath } },
  );
  return response.data.attributes.url;
}

/**
 * Gets a signed URL for uploading files.
 */
export async function getFileUploadUrl(
  serverId: string = SERVER_ID,
): Promise<string> {
  const response = await pteroClient.get<{
    attributes: { url: string };
  }>(
    `/servers/${serverId}/files/upload`,
  );
  return response.data.attributes.url;
}

/**
 * Uploads a file to the server using the signed upload URL.
 * @param uploadUrl - The signed URL from getFileUploadUrl()
 * @param file - The File object to upload
 * @param directory - Target directory (default: "/")
 * @param onProgress - Progress callback (0-100)
 */
export async function uploadFile(
  uploadUrl: string,
  file: File,
  directory = "/",
  onProgress?: (percent: number) => void,
): Promise<void> {
  const formData = new FormData();
  formData.append("files", file);

  await pteroClient.post(
    `${uploadUrl}&directory=${encodeURIComponent(directory)}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percent);
        }
      },
    },
  );
}

/**
 * Copies a file to a new location.
 */
export async function copyFile(
  location: string,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.post(
    `/servers/${serverId}/files/copy`,
    { location },
  );
}

/**
 * Pulls a file from a remote URL to the server.
 */
export async function pullFile(
  url: string,
  directory: string,
  filename: string | undefined,
  useHeader: boolean,
  isForeground: boolean,
  serverId: string = SERVER_ID,
): Promise<void> {
  await pteroClient.post(
    `/servers/${serverId}/files/pull`,
    {
      url,
      directory,
      filename,
      use_header: useHeader,
      foreground: isForeground,
    },
  );
}