import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const documentDirectory = FileSystem.documentDirectory;
const cacheDirectory = FileSystem.cacheDirectory;

// Runtime check for directory availability
const getRootDir = () => {
  if (documentDirectory) return documentDirectory;
  // Fallback to cache if document directory is not available (unlikely on native)
  if (cacheDirectory) return cacheDirectory;
  // Try accessing via cast if types were wrong but runtime has it
  return (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || null;
};

const FILES_DIR_NAME = 'user_files';

// Helper to get the directory path. 
const getFilesDir = () => {
  if (Platform.OS === 'web') {
    return null;
  }
  
  const root = getRootDir();
  if (!root) return null;
  
  return root.endsWith('/') ? root + FILES_DIR_NAME + '/' : root + '/' + FILES_DIR_NAME + '/';
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

  const dir = getFilesDir();
  if (!dir) {
    console.warn('Could not determine storage directory');
    return tempUri;
  }

  // If already in our directory, just return the filename
  if (tempUri.startsWith(dir)) {
    return tempUri.split(FILES_DIR_NAME + '/').pop() || tempUri;
  }

  try {
    await initStorage();
    
    // Check if source file exists
    const fileInfo = await FileSystem.getInfoAsync(tempUri);
    if (!fileInfo.exists) {
      console.warn(`Source file does not exist: ${tempUri}`);
      // Fallback: return the original URI if we can't copy it
      return tempUri;
    }

    const extension = tempUri.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const destination = dir + filename;

    await FileSystem.copyAsync({
      from: tempUri,
      to: destination,
    });
    return filename;
  } catch (error) {
    console.error('Error saving file to library:', error, { tempUri, dir });
    // Don't throw, just return the tempUri so the user can at least see the image for now
    // logic in FilesContext will store the tempUri, which might not be persistent, but better than crashing
    return tempUri; 
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
    // 1. Try to match specific storage directory first
    if (path.includes(FILES_DIR_NAME)) {
      // Extract filename and re-resolve to current documentDirectory
      const parts = path.split(FILES_DIR_NAME + '/');
      const filename = parts[parts.length - 1];
      const dir = getFilesDir();
      if (dir) return dir + filename;
    }

    // 2. Handle files in Documents directory (iOS UUID change support)
    // This catches files that might be in root Documents or if FILES_DIR_NAME check failed
    // It is critical for maintaining access to files after app updates on iOS
    if (path.includes('/Documents/')) {
      const parts = path.split('/Documents/');
      const relative = parts[parts.length - 1];
      
      // We need to rebase this relative path to the CURRENT document directory
      const root = getRootDir();
      if (root) {
        return root + relative;
      }
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
