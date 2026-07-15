import { readFile } from 'node:fs/promises';

import {
  templatesPathsSchema,
  type TemplatesPathsConfig,
} from '../schemas/template.schema.js';
import {
  userSettingsPathsSchema,
  type UserSettingsPathsConfig,
} from '../schemas/user-setting.schema.js';
import { resolveDemPath } from '../services/path.service.js';

const readJson = async (filePath: string): Promise<unknown> => {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content) as unknown;
};

export const loadTemplatesConfig = async (): Promise<TemplatesPathsConfig> => {
  const filePath = resolveDemPath('src', 'config', 'templates.paths.json');
  return templatesPathsSchema.parse(await readJson(filePath));
};

export const loadUserSettingsConfig =
  async (): Promise<UserSettingsPathsConfig> => {
    const filePath = resolveDemPath(
      'src',
      'config',
      'user-settings.paths.json',
    );
    return userSettingsPathsSchema.parse(await readJson(filePath));
  };

/*
const config = await loadTemplatesConfig();
console.dir(config, { depth: null, colors: true });
*/
