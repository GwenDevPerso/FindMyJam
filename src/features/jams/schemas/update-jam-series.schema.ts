import { z } from 'zod';

import { createJamSchema } from '@/features/jams/schemas/create-jam.schema';

/**
 * Template of a series, applied to all its upcoming dates. The start date and the recurrence are left out: the
 * day of a series cannot change, only the time of day (`localTime`, read in the series' time zone).
 */
export const updateJamSeriesSchema = createJamSchema.omit({ startsAt: true, recurrence: true }).extend({
  localTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM format (e.g. 20:00)'),
});

export type UpdateJamSeriesValues = z.infer<typeof updateJamSeriesSchema>;
