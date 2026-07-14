import { z } from 'zod';

import { uuidArraySchema } from '@/lib/validation/common-schemas';

export const searchUsersSchema = z.object({
  query: z.string().trim().max(50),
  instrumentIds: uuidArraySchema,
  styleIds: uuidArraySchema,
  limit: z.number().int().min(1).max(100),
});
