import { z } from 'zod';

import {
  geoCoordinatesSchema,
  skillLevelSchema,
  uuidArraySchema,
} from '@/lib/validation/common-schemas';

export const createJamSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable(),
  startsAt: z.string().datetime({ message: 'Invalid date' }),
  locationName: z.string().trim().min(1, 'Location is required').max(200),
  latitude: geoCoordinatesSchema.shape.latitude,
  longitude: geoCoordinatesSchema.shape.longitude,
  skillLevel: skillLevelSchema,
  maxParticipants: z.number().int().min(2).max(100),
  instrumentIds: uuidArraySchema,
  styleIds: uuidArraySchema,
});

export type CreateJamFormValues = z.infer<typeof createJamSchema>;
