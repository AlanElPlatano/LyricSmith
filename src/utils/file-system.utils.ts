/**
 * Utility functions for file system operations using the File System Access API
 */

/**
 * Checks if the File System Access API is supported in the current browser
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showSaveFilePicker' in window;
}

/**
 * Gets the file extension from a filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Saves a file using "Save As" dialog with the File System Access API.
 * Falls back to traditional download if the API is not supported.
 *
 * @param content - The content to save
 * @param filename - The suggested name for the file
 * @param mimeType - The MIME type of the file
 */
export async function saveFileToFolder(
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): Promise<void> {
  if (!isFileSystemAccessSupported()) {
    // Fallback to traditional download
    downloadFile(content, filename, mimeType);
    return;
  }

  try {
    const extension = getFileExtension(filename);

    // Configure save file picker options
    const options: SaveFilePickerOptions = {
      suggestedName: filename,
      types: extension ? [{
        description: `${extension.toUpperCase()} file`,
        accept: { [mimeType]: [`.${extension}`] }
      }] : []
    };

    // Show save file picker
    const fileHandle = await window.showSaveFilePicker(options);

    // Create writable stream
    const writable = await fileHandle.createWritable();

    // Convert content to blob if it's a string
    const blob = typeof content === 'string'
      ? new Blob([content], { type: mimeType })
      : content;

    // Write the file
    await writable.write(blob);
    await writable.close();

    console.log(`File saved successfully: ${filename}`);
  } catch (error) {
    // User cancelled the picker or other error occurred
    if ((error as Error).name === 'AbortError') {
      console.log('File save cancelled by user');
      throw new Error('File save cancelled');
    } else {
      console.error('Error saving file:', error);
      // Fallback to traditional download on error
      downloadFile(content, filename, mimeType);
    }
  }
}

/**
 * Traditional download fallback for browsers that don't support File System Access API
 */
function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
): void {
  const blob = typeof content === 'string'
    ? new Blob([content], { type: mimeType })
    : content;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Type definitions for File System Access API
 */
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

declare global {
  interface Window {
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }

  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: Blob | string): Promise<void>;
    close(): Promise<void>;
  }
}
