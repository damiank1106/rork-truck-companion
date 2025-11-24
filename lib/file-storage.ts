import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const FILES_DIR_NAME = 'user_files';

// Helper to get the directory path. 
// We handle the case where documentDirectory might be null (web) or have different format.
const getFilesDir = () => {
  if (Platform.OS === 'web') {
    return null;
  }
  // Use documentDirectory. If it's null (shouldn't be on native), fallback to cache
  return (FileSystem.documentDirectory || FileSystem.cacheDirectory) + FILES_DIR_NAME + '/';
};

/**
 * Ensures the directory for user files exists.
 */
export const initStorage = async () => {
  if (Platform.OS === 'web') return;
  
  const dir = getFilesDir();
  if (!dir) return;

  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

/**
 * Saves a file from a temporary URI to the persistent user_files directory.
 * Returns the filename (relative path).
 */
export const saveToLibrary = async (tempUri: string): Promise<string> => {
  if (Platform.OS === 'web') {
    return tempUri; // On web, we can't really "save" to a persistent fs in the same way.
  }

  // If already in our directory, just return the filename
  const dir = getFilesDir();
  if (!dir) return tempUri;

  if (tempUri.startsWith(dir)) {
    return tempUri.split(FILES_DIR_NAME + '/').pop() || tempUri;
  }

  await initStorage();

  const extension = tempUri.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
  const destination = dir + filename;

  try {
    await FileSystem.copyAsync({
      from: tempUri,
      to: destination,
    });
    return filename;
  } catch (error) {
    console.error('Error saving file to library:', error);
    throw error;
  }
};

/**
 * Deletes a file from the persistent storage.
 */
export const deleteFromLibrary = async (filename: string) => {
  if (Platform.OS === 'web') return;
  
  const dir = getFilesDir();
  if (!dir) return;
  
  // If filename is actually a full path, try to extract filename, or just use it if it starts with dir
  let targetPath = dir + filename;
  if (filename.startsWith('file://') || filename.startsWith('/')) {
    targetPath = filename;
  }

  try {
    const info = await FileSystem.getInfoAsync(targetPath);
    if (info.exists) {
      await FileSystem.deleteAsync(targetPath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

/**
 * Resolves a filename (relative path) to a full usable URI.
 * Handles migration if the stored URI was already absolute (legacy).
 */
export const resolveFileUri = (path: string): string => {
  if (!path) return '';
  if (Platform.OS === 'web') return path;
  
  if (path.startsWith('http') || path.startsWith('assets-library')) {
    return path;
  }

  // If it's already a file URI
  if (path.startsWith('file://')) {
    // If it points to our storage directory pattern, we might want to "fix" it if UUID changed?
    // But checking UUID is hard.
    // Heuristic: check if it contains FILES_DIR_NAME
    if (path.includes(FILES_DIR_NAME)) {
      // Extract filename and re-resolve to current documentDirectory
      const parts = path.split(FILES_DIR_NAME + '/');
      const filename = parts[parts.length - 1];
      const dir = getFilesDir();
      if (dir) return dir + filename;
    }
    // Otherwise return as is (maybe it's in bundle or elsewhere)
    return path;
  }

  // Assume it is a relative filename
  const dir = getFilesDir();
  return dir ? dir + path : path;
};

/**
 * Converts a full URI to a relative filename if it belongs to our storage.
 * Used before saving to database.
 */
export const convertToRelativePath = (uri: string): string => {
  if (!uri) return '';
  if (Platform.OS === 'web') return uri;
  
  const dir = getFilesDir();
  if (dir && uri.includes(FILES_DIR_NAME)) {
    const parts = uri.split(FILES_DIR_NAME + '/');
    return parts[parts.length - 1];
  }
  return uri;
};
