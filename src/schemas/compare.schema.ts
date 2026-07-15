import type { ChangeObject } from 'diff';

export const COMPARE_STATUS = {
  PENDING: 0,
  IDENTICAL: 1,
  DIFFERENT: 2,
  MISSING: 3,
  ERROR: 9,
} as const;

export type CompareStatus =
  (typeof COMPARE_STATUS)[keyof typeof COMPARE_STATUS];

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
  status: CompareStatus,
  changes: FileChange[],
];

export type CompareFilePathsMap = Map<string, FileEntry>;

export type CompareResult = {
  key: string;
  sourcePath: string;
  targetPath: string;
  identical: boolean;
  changes: FileChange[];
};
