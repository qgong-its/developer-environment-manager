import { z } from 'zod';

export const platformTargetsSchema = z.object({
  windows: z.string().min(1).optional(),
  linux: z.string().min(1).optional(),
});

export const userSettingPathItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  dotfilesPath: z.string().min(1),
  targets: platformTargetsSchema,
});

export type UserSettingPathItem = z.infer<typeof userSettingPathItemSchema>;

export const userSettingsPathsSchema = z.object({
  name: z.literal('user-settings'),
  dotfilesPath: z.string().min(1),
  items: z.array(userSettingPathItemSchema),
});

export type UserSettingsPathsConfig = z.infer<typeof userSettingsPathsSchema>;
