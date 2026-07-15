import { diffLines } from 'diff';
import { readFile } from 'node:fs/promises';
import { CompareResult, FileChange } from '../schemas/compare.schema.js';

export const compareFile = async (
  key: string,
  sourcePath: string,
  targetPath: string,
): Promise<CompareResult> => {
  const [sourceContent, targetContent] = await Promise.all([
    readFile(sourcePath, 'utf8'),
    readFile(targetPath, 'utf8'),
  ]);

  const changes: FileChange[] = diffLines(sourceContent, targetContent);

  const identical = changes.every((change) => !change.added && !change.removed);

  return {
    key,
    sourcePath,
    targetPath,
    identical,
    changes,
  };
};
