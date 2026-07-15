export type FilePathIndex = 0 | 1 | 2;

export type DiffMode = 'host' | 'runtime' | 'p2p' | 'cross';

export type CompareIndexes = readonly [FilePathIndex, FilePathIndex];

export const DIFF_INDEX_MAP: ReadonlyMap<DiffMode, CompareIndexes> =
  new Map([
    ['host', [0, 1]],
    ['runtime', [1, 2]],
    ['p2p', [1, 2]],
    ['cross', [0, 2]],
  ]);



