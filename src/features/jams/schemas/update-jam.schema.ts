import { z } from 'zod';

import { createJamSchema } from '@/features/jams/schemas/create-jam.schema';

export const updateJamSchema = createJamSchema;

export type UpdateJamFormValues = z.infer<typeof updateJamSchema>;
