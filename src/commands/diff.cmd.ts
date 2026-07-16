import { FileChange, type CompareResult } from '../schemas/compare.schema.js';
import { DIFF_INDEX_MAP, DiffMode } from '../schemas/diff.schema.js';
import { compareFile } from '../services/compare-file.service.js';
import { buildOptFilePathsMaps } from '../services/build-opt-map.service.js';
import { writeLogLine } from '../services/logger.service.js';
import { OPT_STATUS } from '../schemas/opt.schema.js';
import { isFile } from '../utils/file.utils.js';

const formatChanged = (change: FileChange): string => {
  const prefix = change.added ? '+ ' : change.removed ? '- ' : '  ';

  if (!prefix) {
    return '';
  }

  return change.value
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => `${prefix}${line}`)
    .join('\n');
};

const formatResult = (result: CompareResult): string => {
  const header = [
    result.identical ? 'Files are identical.' : 'Files are different.',
    `Key: ${result.key}`,
    `Source: ${result.sourcePath}`,
    `Target: ${result.targetPath}`,
  ].join('\n');

  if (result.identical) {
    return header;
  }

  const changes = result.changes.map(formatChanged).filter(Boolean).join('\n');

  return [header, '', 'Changes', changes || '(No textual changes found.)'].join(
    '\n',
  );
};

const createMissingCompareResult = (
  key: string,
  sourcePath: string | 0,
  targetPath: string | 0,
): CompareResult => ({
  key,
  sourcePath: sourcePath === 0 ? '<missing>' : sourcePath,
  targetPath: targetPath === 0 ? '<missing>' : targetPath,
  status: OPT_STATUS.MISSING,
  identical: false,
  changes: [],
});

export const diff = async (
  mode: DiffMode,
  scope?: string,
  id?: string,
  ...args: string[]
): Promise<CompareResult[]> => {
  const indexes = DIFF_INDEX_MAP.get(mode);

  if (!indexes) {
    throw new Error(`Unsupported diff mode: "${mode}"`);
  }

  const [sourceIndex, targetIndex] = indexes;

  const optMaps = await buildOptFilePathsMaps(scope, id, ...args);

  const results: CompareResult[] = [];

  for (const optMap of optMaps) {
    for (const [key, fileEntry] of optMap) {
      const sourcePath = fileEntry[sourceIndex];
      const targetPath = fileEntry[targetIndex];

      if (sourcePath === 0 || targetPath === 0) {
        const result = createMissingCompareResult(key, sourcePath, targetPath);

        fileEntry[3] = result.status;
        fileEntry[4] = result.changes;

        writeLogLine('DIFF', key, formatResult(result));

        results.push(result);

        continue;
      }

      const sourceFileExists = await isFile(sourcePath);
      const targetFileExists = await isFile(targetPath);

      if (!sourceFileExists || !targetFileExists) {
        const result = createMissingCompareResult(
          key,
          sourceFileExists ? sourcePath : `${sourcePath} <not found>`,
          targetFileExists ? targetPath : `${targetPath} <not found>`,
        );

        fileEntry[3] = result.status;
        fileEntry[4] = result.changes;

        writeLogLine('DIFF', key, formatResult(result));

        results.push(result);

        continue;
      }

      const result = await compareFile(key, sourcePath, targetPath);

      fileEntry[3] = result.identical
        ? OPT_STATUS.IDENTICAL
        : OPT_STATUS.DIFFERENT;
      fileEntry[4] = result.changes;

      writeLogLine('DIFF', key, formatResult(result));

      results.push(result);
    }
  }

  return results;
};
