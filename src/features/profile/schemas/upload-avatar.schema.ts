import { z } from 'zod';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const uploadAvatarSchema = z.object({
  uri: z.string().min(1, 'Image URI is required'),
  mimeType: z.enum(allowedMimeTypes, {
    message: 'Avatar must be a JPEG, PNG or WebP image',
  }),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_AVATAR_SIZE_BYTES, 'Avatar must be 5 MB or smaller'),
});

export type UploadAvatarFormValues = z.infer<typeof uploadAvatarSchema>;
