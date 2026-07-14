import { z } from 'zod';

import { idSchema } from '@/lib/validation/common-schemas';

export const sendFriendRequestSchema = z.object({
  addresseeId: idSchema,
});

export const friendshipActionSchema = z.object({
  friendshipId: idSchema,
});
