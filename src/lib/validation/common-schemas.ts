import { z } from 'zod';

export const idSchema = z.string().uuid();

export const skillLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'all_levels',
]);

export const geoCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const uuidArraySchema = z.array(idSchema);
