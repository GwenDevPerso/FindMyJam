import { z } from 'zod';

/** Same bound as the `jam_messages_body_length` check in the database. */
export const CHAT_MESSAGE_MAX_LENGTH = 2000;

export const chatMessageBodySchema = z
  .string()
  .trim()
  .min(1, 'Write a message')
  .max(CHAT_MESSAGE_MAX_LENGTH, `Messages are limited to ${CHAT_MESSAGE_MAX_LENGTH} characters`);

export const sendChatMessageSchema = z.object({
  body: chatMessageBodySchema,
});

export const chatMessageListParamsSchema = z.object({
  limit: z.number().int().min(1).max(100),
  cursor: z
    .object({
      createdAt: z.string(),
      id: z.string().uuid(),
    })
    .nullable(),
});

export type SendChatMessageValues = z.infer<typeof sendChatMessageSchema>;
