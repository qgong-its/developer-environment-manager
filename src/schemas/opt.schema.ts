import { z } from 'zod';

export const optScopeSchema = z.enum(['user-settings', 'templates']);

export type OptScope = z.infer<typeof optScopeSchema>;

export const optFilePathSchema = z.union([z.string().min(1), z.literal(0)]);

export type OptFilePath = z.infer<typeof optFilePathSchema>;

export const optStatusSchema = z.number().int();

export type OptStatus = z.infer<typeof optStatusSchema>;

export const fileChangeSchema = z.unknown();

export type FileChange = z.infer<typeof fileChangeSchema>;

export const fileEntrySchema = z.tuple([
  optFilePathSchema, // [0] Host dotfiles path
  optFilePathSchema, // [1] VM dotfiles path
  optFilePathSchema, // [2] Current/project file path
  optStatusSchema, // [3] Current comparison status
  z.array(fileChangeSchema), // [4] Detailed changes
]);

export type FileEntry = z.infer<typeof fileEntrySchema>;

export const optFilePathsMapSchema = z.map(
  z.string().min(1),
  fileEntrySchema,
);

export type OptFilePathsMap = z.infer<typeof optFilePathsMapSchema>;
