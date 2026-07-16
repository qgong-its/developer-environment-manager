import { homedir } from 'node:os';
import { isAbsolute, resolve } from 'node:path';
import { getPlatform } from './platform.service.js';

/**
 * Returns the DevEnvMgr project root.
 *
 * DevEnvMgr is currently expected to be started from its project root,
 * therefore the current working directory is treated as the DEM root.
 *
 * Note:
 * This is suitable during development. If DevEnvMgr is later installed as
 * a global CLI, the application root should be resolved independently from
 * process.cwd().
 */
export const getDemRootDir = (): string => process.cwd();

/**
 * Resolves a path below the DevEnvMgr project root.
 *
 * Typical usage:
 *   resolveDemPath('src', 'config', 'templates.paths.json')
 *   resolveDemPath('logs')
 */
export const resolveDemPath = (...paths: string[]): string =>
  resolve(getDemRootDir(), ...paths);

// console.log(resolveDemPath('src', 'config', 'templates.paths.json'));

/**
 * Returns the current operating-system user's home directory.
 *
 * Examples:
 *   Linux:   /home/qian
 *   Windows: C:\Users\Qian
 */
export const getUserHomeDir = (): string => homedir();

/**
 * Resolves a filesystem path relative to the current user's home directory.
 *
 * Relative paths are resolved below UserHome.
 * Absolute paths are preserved and may be extended with additional segments.
 *
 * This allows callers to use the same function for:
 * - application defaults;
 * - environment-variable values;
 * - configuration-file values;
 * - CLI destination arguments.
 *
 * Examples:
 *   resolveUserHomePath('Workspace', 'my-project')
 *     Linux:   /home/user/Workspace/my-project
 *     Windows: C:\Users\User\Workspace\my-project
 *
 *   resolveUserHomePath('/mnt/projects', 'my-project')
 *     Linux: /mnt/projects/my-project
 *
 *   resolveUserHomePath('D:\\Projects', 'my-project')
 *     Windows: D:\Projects\my-project
 */
export const resolveUserHomePath = (
  firstPath: string,
  ...paths: string[]
): string => {
  const basePath = isAbsolute(firstPath)
    ? firstPath
    : resolve(getUserHomeDir(), firstPath);

  return resolve(basePath, ...paths);
};

// console.log(resolveUserHomePath('Workspace', 'my-project'));

/**
 * Returns the current machine's local Workspace directory.
 *
 * Default:
 *   <UserHome>/Workspace
 *
 * Optional override:
 *   DEM_WORKSPACE_DIR
 *
 * The environment value may be:
 * - relative to UserHome, for example: Workspace
 * - absolute, for example: /data/Workspace
 * - absolute on Windows, for example: D:\Workspace
 */
export const getWorkspaceDir = (): string =>
  resolveUserHomePath(process.env.DEM_WORKSPACE_DIR?.trim() || 'Workspace');

/**
 * Resolves a path below the current machine's local Workspace directory.
 *
 * Examples:
 *   resolveWorkspacePath('dotfiles')
 *   resolveWorkspacePath('projects', 'my-api')
 */
export const resolveWorkspacePath = (...paths: string[]): string =>
  resolve(getWorkspaceDir(), ...paths);

/**
 * Returns the current machine's local DevEnvMgr dotfiles directory.
 *
 * Default:
 *   <Workspace>/dotfiles
 *
 * Optional override:
 *   <Workspace>/DOTFILES_DIR
 *
 * If DOTFILES_DIR is not configured, the directory is derived from the
 * configured Workspace directory. This means changing DEM_WORKSPACE_DIR also
 * changes the default dotfiles location.
 */
export const getDotfilesDir = (): string =>
  resolveWorkspacePath(process.env.DOTFILES_DIR?.trim() || 'dotfiles');

/**
 * Resolves a managed resource path below the current machine's local
 * dotfiles directory.
 *
 * Examples:
 *   resolveDotfilesPath('templates', 'node-ts')
 *   resolveDotfilesPath('user', 'linux', '.bashrc')
 */
export const resolveDotfilesPath = (...paths: string[]): string =>
  resolve(getDotfilesDir(), ...paths);

/*
console.log({
  cwd: process.cwd(),
  dotfilesEnv: process.env.DOTFILES_DIR,
  resolved: resolveDotfilesPath('templates/node-ts'),
});
*/

/**
 * Returns the path through which the current virtual machine accesses the
 * physical host's shared Workspace directory.
 *
 * The environment variable must contain the path as visible inside the
 * current VM. It must not contain the physical host's native filesystem path.
 *
 * Examples for required environment variable::
 *
 * Windows host → Linux VM:
 *   HOST_WORKSPACE_MOUNT=/mnt/hgfs/Workspace
 *
 * Ubuntu host → Linux VM:
 *   HOST_WORKSPACE_MOUNT=/mnt/hgfs/Workspace
 *
 * Ubuntu host → Windows VM:
 *   HOST_WORKSPACE_MOUNT=Z:\Workspace
 *
 * Windows or Ubuntu host → Windows VM through UNC:
 *   HOST_WORKSPACE_MOUNT=\\vmware-host\Shared Folders\Workspace
 *
 * The host operating system is irrelevant to DevEnvMgr. Only the mount path
 * visible from the current VM matters.
 */

export const getHostWorkspaceMountDir = (): string => {
  const platform = getPlatform();

  const HOST_WORKSPACE_MOUNT =
    platform === 'linux'
      ? 'HOST_WORKSPACE_VM_UBUNTU'
      : platform === 'windows'
        ? 'HOST_WORKSPACE_VM_WINDOWS'
        : '';

  if (!HOST_WORKSPACE_MOUNT) {
    throw new Error(`Unsupported platform: "${platform}"`);
  }

  const configuredPath = process.env[HOST_WORKSPACE_MOUNT]?.trim();

  if (!configuredPath) {
    throw new Error(
      `Missing required environment variable: ${HOST_WORKSPACE_MOUNT}`,
    );
  }

  return resolve(configuredPath);
};

/*
console.log({
  cwd: process.cwd(),
  platform: getPlatform(),
  HOST_WORKSPACE_VM_UBUNTU: process.env.HOST_WORKSPACE_VM_UBUNTU,
  HOST_WORKSPACE_VM_WINDOWS: process.env.HOST_WORKSPACE_VM_WINDOWS,
  configuredPath: getHostWorkspaceMountDir(),
});
*/

/**
 * Resolves a path below the physical host's Workspace mount as seen from
 * the current VM.
 *
 * Examples:
 *   resolveHostWorkspacePath('dotfiles')
 *   resolveHostWorkspacePath('dotfiles', 'templates', 'node-ts')
 */
export const resolveHostWorkspacePath = (...paths: string[]): string =>
  resolve(getHostWorkspaceMountDir(), ...paths);

/**
 * Returns the physical host's dotfiles directory through the VMware
 * Workspace mount.
 *
 * Result:
 *   <HOST_WORKSPACE_MOUNT>/dotfiles
 */
export const getHostDotfilesDir = (): string =>
  resolveHostWorkspacePath(process.env.DOTFILES_DIR?.trim() || 'dotfiles');

/*
console.log(getHostDotfilesDir());
*/

/**
 * Resolves a managed resource path below the physical host's mounted
 * dotfiles directory.
 *
 * This function is primarily intended for diff and sync operations between:
 *
 *   current VM dotfiles
 *       ↕
 *   physical host dotfiles
 *
 * Examples:
 *   resolveHostDotfilesPath('templates', 'node-ts')
 *   resolveHostDotfilesPath('user', 'linux', '.bashrc')
 */
export const resolveHostDotfilesPath = (...paths: string[]): string =>
  resolve(getHostDotfilesDir(), ...paths);
