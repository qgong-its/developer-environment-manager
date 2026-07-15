import { cp } from 'node:fs/promises';

import { loadTemplatesConfig } from '../config/config.loader.js';
import { ensureDirectory, ensureEmptyDirectory } from '../utils/file.utils.js';
import {
  resolveDotfilesPath,
  resolveWorkspacePath,
} from '../services/path.service.js';
import { writeLogLine } from '../services/logger.service.js';

export const create = async (
  framework: string,
  language: string,
  destination: string,
) => {
  const templateId = `${framework}-${language}`;

  const templatesConfig = await loadTemplatesConfig();

  const template = templatesConfig.items.find(({ id }) => id === templateId);

  if (!template) {
    throw new Error(`Cannot find any template with id: "${templateId}"`);
  }

  const sourcePath = resolveDotfilesPath(template.dotfilesPath);

  const destinationPath = resolveWorkspacePath(destination);

  try {
    await ensureDirectory(sourcePath);

    await ensureEmptyDirectory(destinationPath);

    await cp(sourcePath, destinationPath, {
      recursive: true,
      force: false,
      errorOnExist: false,
    });

    writeLogLine(
      'CREATE',
      destination,
      [
        'Project created successfully.',
        `Template: ${templateId}`,
        `Source: ${sourcePath}`,
        `Destination: ${destinationPath}`,
      ].join('\n'),
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    writeLogLine(
      'CREATE',
      destination,
      [
        'Failed to create project.',
        `Template: ${templateId}`,
        `Source: ${sourcePath}`,
        `Destination: ${destinationPath}`,
        `Reason: ${reason}`,
      ].join('\n'),
    );

    throw new Error(`Failed to create project from template "${templateId}".`, {
      cause: error,
    });
  }
};
