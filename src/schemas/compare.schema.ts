import type { ChangeObject } from 'diff';
import { OptStatus } from './opt.schema.js';

export type CompareFilePath = string | 0;

/*
 * {
 *    value: string;
 *    added?: boolean;
 *    removed?: boolean;
 *    count?: number;
 * }
 */
export type FileChange = ChangeObject<string>;

export type FileEntry = [
  hostDotPath: CompareFilePath,
  vmDotPath: CompareFilePath,
  filePath: CompareFilePath,
  status: OptStatus,
  changes: FileChange[],
];

export type CompareFilePathsMap = Map<string, FileEntry>;

export type CompareResult = {
  key: string;
  sourcePath: string;
  targetPath: string;
  status: OptStatus;
  identical: boolean;
  changes: FileChange[];
};
