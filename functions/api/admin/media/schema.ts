import { z } from 'zod';

export const mediaIdSchema = z.string().uuid();
export const mediaAltTextSchema = z.string().trim().max(240);
export const mediaSearchSchema = z.string().trim().max(100).default('');

export const allowedImageTypes = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type AllowedImageType = keyof typeof allowedImageTypes;
