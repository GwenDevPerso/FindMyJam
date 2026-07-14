import { z } from 'zod';

import { geoCoordinatesSchema, skillLevelSchema, uuidArraySchema } from '@/lib/validation/common-schemas';

export const updateProfileFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be 30 characters or less')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
    bio: z.string().trim().max(500, 'Bio must be 500 characters or less'),
    skillLevel: skillLevelSchema.nullable(),
    locationName: z.string().trim().max(200, 'Location must be 200 characters or less'),
    latitude: geoCoordinatesSchema.shape.latitude.nullable(),
    longitude: geoCoordinatesSchema.shape.longitude.nullable(),
    instrumentIds: uuidArraySchema,
    styleIds: uuidArraySchema,
  })
  .superRefine((values, context) => {
    const hasLatitude = values.latitude !== null;
    const hasLongitude = values.longitude !== null;

    if (hasLatitude !== hasLongitude) {
      context.addIssue({
        code: 'custom',
        message: 'Latitude and longitude must both be set or both be empty',
        path: ['latitude'],
      });
    }
  });

export const updateProfileSchema = updateProfileFormSchema.transform((values) => ({
  username: values.username,
  bio: values.bio.length === 0 ? null : values.bio,
  skillLevel: values.skillLevel,
  locationName: values.locationName.length === 0 ? null : values.locationName,
  latitude: values.latitude,
  longitude: values.longitude,
  instrumentIds: values.instrumentIds,
  styleIds: values.styleIds,
}));

export type UpdateProfileFormValues = z.infer<typeof updateProfileFormSchema>;
