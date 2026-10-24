import {
  CHAT_MESSAGE_MAX_LENGTH,
  chatMessageListParamsSchema,
  sendChatMessageSchema,
} from '@/features/chat/schemas/chat-message.schema';

const MESSAGE_ID = '44444444-4444-4444-8444-444444444444';

describe('sendChatMessageSchema', () => {
  it('accepts a message and trims it', () => {
    const result = sendChatMessageSchema.safeParse({ body: '  See you at 8!  \n' });

    expect(result.success).toBe(true);
    expect(result.data?.body).toBe('See you at 8!');
  });

  it('rejects a message that is only whitespace', () => {
    const result = sendChatMessageSchema.safeParse({ body: ' \n\t ' });

    expect(result.success).toBe(false);
  });

  it('accepts a message of the maximum length', () => {
    const result = sendChatMessageSchema.safeParse({ body: 'a'.repeat(CHAT_MESSAGE_MAX_LENGTH) });

    expect(result.success).toBe(true);
  });

  it('rejects a message longer than the maximum length', () => {
    const result = sendChatMessageSchema.safeParse({ body: 'a'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1) });

    expect(result.success).toBe(false);
  });
});

describe('chatMessageListParamsSchema', () => {
  it('accepts a first page', () => {
    const result = chatMessageListParamsSchema.safeParse({ limit: 30, cursor: null });

    expect(result.success).toBe(true);
  });

  it('accepts a cursor', () => {
    const result = chatMessageListParamsSchema.safeParse({
      limit: 30,
      cursor: { createdAt: '2026-10-24T18:00:00.000Z', id: MESSAGE_ID },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a limit above 100', () => {
    const result = chatMessageListParamsSchema.safeParse({ limit: 101, cursor: null });

    expect(result.success).toBe(false);
  });

  it('rejects a cursor with an invalid id', () => {
    const result = chatMessageListParamsSchema.safeParse({
      limit: 30,
      cursor: { createdAt: '2026-10-24T18:00:00.000Z', id: 'not-a-uuid' },
    });

    expect(result.success).toBe(false);
  });
});
