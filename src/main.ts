import { create } from './commands/create.cmd.js';

import { diff } from './commands/diff.cmd.js';
import type { DiffMode } from './schemas/diff.schema.js';

class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliUsageError';
  }
}

const printUsage = (): void => {
  console.log(`
Usage:
  dem create <framework> <language> <destination>

  dem diff host [scope] [id]
  dem diff runtime <scope> [id] [runtime-path]
  dem diff cross <scope> <id> <runtime-path>
  dem diff p2p <source-path> <target-path>

Example:
  dem create node ts Workspace/my-api

  dem diff host user-settings common/gitconfig
  dem diff runtime user-settings common/gitconfig ~/.gitconfig
  dem diff runtime templates node-ts Workspace/my-api
  dem diff cross templates node-ts Workspace/my-api
  dem diff p2p ./first.txt ./second.txt
`);
};

const DIFF_MODES = new Set<DiffMode>(['host', 'runtime', 'p2p', 'cross']);

const isDiffMode = (mode: string): mode is DiffMode =>
  DIFF_MODES.has(mode as DiffMode);

const validateDiffArgs = (mode: DiffMode, parameters: string[]): void => {
  if (mode === 'p2p' && parameters.length !== 2) {
    throw new Error('Usage: dem diff p2p <source-path> <target-path>');
  }

  if (mode === 'cross' && parameters.length !== 3) {
    throw new Error('Usage: dem diff cross <scope> <id> <runtime-path>');
  }

  if (mode === 'runtime' && parameters.length < 1) {
    throw new Error('Usage: dem diff runtime <scope> [id] [runtime-path]');
  }

  if (mode === 'host' && parameters.length > 2) {
    throw new Error('Usage: dem diff host [scope] [id]');
  }
};

const main = async (): Promise<void> => {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    throw new CliUsageError('Missing command.');
  }

  switch (command) {
    case 'create': {
      const [framework, language, destination] = args;

      if (!framework || !language || !destination) {
        throw new CliUsageError('Missing arguments for the create command.');
      }

      const templateId = `${framework}-${language}`;

      await create(framework, language, destination);

      console.log(`✅ Project created from template "${templateId}".`);

      console.log(`📁 Destination: ${destination}`);

      return;
    }

    case 'diff': {
      const [mode, ...parameters] = args;

      if (!mode || !isDiffMode(mode)) {
        throw new CliUsageError(`Unknown or missing diff mode: "${mode ?? ''}"`);
      }

      validateDiffArgs(mode, parameters);

      const results =
        mode === 'p2p'
          ? await diff(mode, undefined, undefined, ...parameters)
          : await diff(
              mode,
              parameters[0],
              parameters[1],
              ...parameters.slice(2),
            );

      const identicalCount = results.filter(
        (result) => result.identical,
      ).length;

      const differentCount = results.length - identicalCount;

      console.log(
        `✅ Compared ${results.length} file(s): ${identicalCount} identical, ${differentCount} different.`,
      );

      return;
    }

    default:
      console.error(`❌ Unknown command: "${command}"`);

      printUsage();
      process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'An unknown error occurred.';

  console.error(`❌ ${message}`);

  if (error instanceof CliUsageError) {
    printUsage();
  }

  process.exitCode = 1;
});
