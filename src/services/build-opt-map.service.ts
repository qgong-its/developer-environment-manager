import { resolve } from 'node:path';
import {
  loadTemplatesConfig,
  loadUserSettingsConfig,
} from '../config/config.loader.js';
import {
  OptFilePathsMap,
  OptScope,
  optScopeSchema,
  FileEntry,
} from '../schemas/opt.schema.js';
import { TemplatesPathsConfig } from '../schemas/template.schema.js';
import { UserSettingsPathsConfig } from '../schemas/user-setting.schema.js';
import { isDirectory, isFile } from '../utils/file.utils.js';
import {
  resolveDotfilesPath,
  resolveHostDotfilesPath,
} from './path.service.js';

const buildPathToPathOptMap = async (
  referencePath: string,
  currentPath: string,
): Promise<OptFilePathsMap> => {
  for (const path of [referencePath, currentPath]) {
    if (!(await isFile(path))) {
      throw new Error(`Path is not a file: "${path}"`);
    }
  }

  const optFilePathsMap: OptFilePathsMap = new Map();

  const fileEntry: FileEntry = [0, referencePath, currentPath, 0, []];

  optFilePathsMap.set('p2p', fileEntry);

  return optFilePathsMap;
};

// User-Defined Type Guards
export const isOptScope = (value: unknown): value is OptScope => {
  if (typeof value !== 'string') return false;

  return optScopeSchema.safeParse(value).success;
};

type OptPathDefinition = {
  key: string;
  paths: string[];
};

const buildOptPathDefinitions = async (
  scope: OptScope,
): Promise<OptPathDefinition[]> => {
  if (scope === 'templates') {
    const config: TemplatesPathsConfig = await loadTemplatesConfig();

    return config.items.flatMap((item) =>
      item.targets.map((target) => ({
        key: `${item.id}/${target}`,
        paths: [item.dotfilesPath, target],
      })),
    );
  }

  const config: UserSettingsPathsConfig = await loadUserSettingsConfig();

  return config.items.map((item) => ({
    key: item.id,
    paths: [item.dotfilesPath],
  }));
};

const buildScopeOptMap = async (scope: OptScope): Promise<OptFilePathsMap> => {
  const definitions = await buildOptPathDefinitions(scope);

  const optFilePathsMap: OptFilePathsMap = new Map();

  for (const definition of definitions) {
    const fileEntry: FileEntry = [
      resolveHostDotfilesPath(...definition.paths),
      resolveDotfilesPath(...definition.paths),
      0,
      0,
      [],
    ];

    optFilePathsMap.set(definition.key, fileEntry);
  }

  return optFilePathsMap;
};

const COMPARE_SCOPES: OptScope[] = ['templates', 'user-settings'];

const filterOptMapById = (
  scope: OptScope,
  id: string,
  scopeMap: OptFilePathsMap,
): OptFilePathsMap => {
  const resultMap: OptFilePathsMap = new Map();

  if (scope === 'user-settings') {
    const fileEntry = scopeMap.get(id);

    if (!fileEntry) {
      throw new Error(`No configuration item found for id: "${id}"`);
    }

    resultMap.set(id, fileEntry);

    return resultMap;
  }

  const idPrefix = `${id}/`;

  for (const [key, fileEntry] of scopeMap) {
    if (key.startsWith(idPrefix)) {
      resultMap.set(key, fileEntry);
    }
  }

  if (resultMap.size === 0) {
    throw new Error(`No template configuration found for id: "${id}"`);
  }

  return resultMap;
};

const buildOptMapById = async (
  scope: OptScope,
  id: string,
): Promise<OptFilePathsMap> => {
  const scopeMap = await buildScopeOptMap(scope);

  return filterOptMapById(scope, id, scopeMap);
};

const buildRuntimeOptMap = async (
  scope: OptScope,
  id: string,
  runtimePath: string,
): Promise<OptFilePathsMap> => {
  const optMap = await buildOptMapById(scope, id);

  if (scope === 'user-settings') {
    if (!(await isFile(runtimePath))) {
      throw new Error(`Runtime path is not a file: "${runtimePath}"`);
    }

    for (const fileEntry of optMap.values()) {
      fileEntry[2] = runtimePath;
    }
  } else {
    if (!(await isDirectory(runtimePath))) {
      throw new Error(`Runtime path is not a directory: "${runtimePath}"`);
    }

    for (const [key, fileEntry] of optMap) {
      const relativeTarget = key.slice(`${id}/`.length);

      fileEntry[2] = resolve(runtimePath, relativeTarget);
    }
  }

  return optMap;
};

export const buildOptFilePathsMaps = async (
  scope?: string,
  id?: string,
  ...args: string[]
): Promise<OptFilePathsMap[]> => {
  const optFilePathsMaps: OptFilePathsMap[] = [];

  if (scope === undefined && id === undefined && args.length === 2) {
    const [firstPath, secondPath] = args;

    const optFilePathsMap = await buildPathToPathOptMap(firstPath, secondPath);

    optFilePathsMaps.push(optFilePathsMap);
  }

  if (isOptScope(scope) && id === undefined && args.length === 0) {
    optFilePathsMaps.push(await buildScopeOptMap(scope));
  }

  if (isOptScope(scope) && id !== undefined && args.length === 0) {
    optFilePathsMaps.push(await buildOptMapById(scope, id));
  }

  if (isOptScope(scope) && id !== undefined && args.length === 1) {
    const [runtimePath] = args;

    optFilePathsMaps.push(await buildRuntimeOptMap(scope, id, runtimePath));
  }

  if (scope === undefined && id === undefined && args.length === 0) {
    for (const currentScope of COMPARE_SCOPES) {
      optFilePathsMaps.push(await buildScopeOptMap(currentScope));
    }
  }

  return optFilePathsMaps;
};
