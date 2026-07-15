import { z } from 'zod';

export const templatePathItemSchema = z.object({
  id: z.string().min(1),
  framework: z.string().min(1),
  language: z.string().min(1),
  type: z.string().min(1),
  dotfilesPath: z.string().min(1),
  targets: z.array(z.string().min(1)).min(1),
});

export type TemplatePathItem = z.infer<typeof templatePathItemSchema>;

export const templatesPathsSchema = z.object({
  name: z.literal('templates'),
  dotfilesPath: z.string().min(1),
  frameworks: z.array(z.string().min(1)),
  languages: z.array(z.string().min(1)),
  items: z.array(templatePathItemSchema),
});

export type TemplatesPathsConfig = z.infer<typeof templatesPathsSchema>;
