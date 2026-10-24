import { z } from 'zod';

import { createJamSchema } from '@/features/jams/schemas/create-jam.schema';

/** Updates one jam (a one-off jam, or one date of a series); the recurrence is set at creation only. */
export const updateJamSchema = createJamSchema.omit({ recurrence: true });

export type UpdateJamFormValues = z.infer<typeof updateJamSchema>;
