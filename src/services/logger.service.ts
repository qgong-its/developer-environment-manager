import fs from 'node:fs';
import path from 'node:path';

import { resolveDemPath } from './path.service.js';

const logDir = resolveDemPath('logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, {
    recursive: true,
  });
}

export type CMD = 'CREATE' | 'DIFF' | 'PULL' | 'PUSH' | 'SYNC';

const sanitizeFileName = (value: string): string =>
  value.replaceAll(/[\\/:*?"<>|]/g, '_');

const generateLogFilePath = (cmd: CMD = 'DIFF', fileName = 'default') => {
  const date = new Date().toISOString().split('T')[0];

  const safeFileName = sanitizeFileName(fileName);

  return path.join(logDir, `${date}__${cmd.toLowerCase()}__${safeFileName}.log`);
};

/**
 * Writes a detailed message to the command-specific log file.
 *
 * Console output is intentionally handled by the caller so that the CLI
 * can display a shorter, user-friendly message.
 */
export const writeLogLine = (cmd: CMD, fileName: string, message: string) => {
  const timestamp = new Date().toTimeString().split(' ')[0];

  const logLine = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(generateLogFilePath(cmd, fileName), logLine, 'utf-8');
};
