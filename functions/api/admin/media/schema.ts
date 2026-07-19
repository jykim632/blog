import { z } from 'zod';

export const mediaIdSchema = z.string().uuid();
export const mediaAltTextSchema = z.string().trim().max(240);
export const mediaFilenameSchema = z.string().trim().min(1).max(180);
export const mediaUpdateSchema = z.object({
  alt: mediaAltTextSchema.optional(),
  filename: mediaFilenameSchema.optional(),
}).refine((value) => value.alt !== undefined || value.filename !== undefined, {
  message: '수정할 정보를 입력해 주세요.',
});
export const mediaSearchSchema = z.string().trim().max(100).default('');

export const allowedImageTypes = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type AllowedImageType = keyof typeof allowedImageTypes;
