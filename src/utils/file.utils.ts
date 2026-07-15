import { constants } from 'node:fs';
import { access, mkdir, readdir, stat, lstat } from 'node:fs/promises';

/**
 * Checks whether a filesystem path is accessible.
 *
 * Returns false when the path does not exist or cannot be accessed.
 */
export const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

export const isFile = async (targetPath: string): Promise<boolean> => {
  try {
    const targetStat = await lstat(targetPath);

    return targetStat.isFile();
  } catch {
    return false;
  }
};

/**
 * Checks whether the given path points to a directory.
 *
 * Returns false when the path does not exist or points to another
 * resource type, such as a regular file.
 */
export const isDirectory = async (targetPath: string): Promise<boolean> => {
  try {
    const targetStat = await stat(targetPath);

    return targetStat.isDirectory();
  } catch {
    return false;
  }
};

/**
 * Checks whether the given directory contains no entries.
 *
 * The caller should first verify that the path exists and is a directory.
 */
export const isDirectoryEmpty = async (
  directoryPath: string,
): Promise<boolean> => {
  const entries = await readdir(directoryPath);

  return entries.length === 0;
};

/**
 * Ensures that the path exists and points to a directory.
 */
export const ensureDirectory = async (directoryPath: string): Promise<void> => {
  if (!(await pathExists(directoryPath))) {
    throw new Error(`Directory does not exist: "${directoryPath}"`);
  }

  if (!(await isDirectory(directoryPath))) {
    throw new Error(`Path is not a directory: "${directoryPath}"`);
  }
};

/**
 * Ensures that a path is ready to receive the contents of a new directory.
 *
 * Behavior:
 * - missing path: creates the directory;
 * - existing empty directory: accepts it;
 * - existing file: throws;
 * - existing non-empty directory: throws.
 *
 * When this function resolves successfully, the destination exists and
 * is an empty directory.
 */
export const ensureEmptyDirectory = async (
  directoryPath: string,
): Promise<void> => {
  const exists = await pathExists(directoryPath);

  if (!exists) {
    await mkdir(directoryPath, {
      recursive: true,
    });

    return;
  }

  const directory = await isDirectory(directoryPath);

  if (!directory) {
    throw new Error(`Path exists but is not a directory: "${directoryPath}"`);
  }

  const empty = await isDirectoryEmpty(directoryPath);

  if (!empty) {
    throw new Error(`Directory is not empty: "${directoryPath}"`);
  }
};
