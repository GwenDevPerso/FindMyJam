import type { PostgrestError } from '@supabase/supabase-js';

import type {
  ChatMessage,
  ChatMessageListCursor,
  ChatMessageListResult,
  ChatRoom,
} from '@/features/chat/types';
import {
  chatMessageListParamsSchema,
  sendChatMessageSchema,
} from '@/features/chat/schemas/chat-message.schema';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import type { JamMessageWithSenderRow } from '@/lib/supabase/types';
import { chatRepository } from '@/repositories/chat.repository';

function assertNoError(error: PostgrestError | null): void {
  if (error !== null) {
    throw mapSupabaseError(error);
  }
}

function toRoomColumns(room: ChatRoom): { jamId: string | null; seriesId: string | null } {
  return room.kind === 'series'
    ? { jamId: null, seriesId: room.seriesId }
    : { jamId: room.jamId, seriesId: null };
}

function mapMessageRow(row: JamMessageWithSenderRow): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderUsername: row.sender_username,
    senderAvatarUrl: row.sender_avatar_url,
    body: row.body,
    createdAt: row.created_at,
  };
}

/** Messages come newest first, so the next (older) page starts after the last one. */
function buildNextCursor(messages: ChatMessage[], limit: number): ChatMessageListCursor | null {
  if (messages.length < limit) {
    return null;
  }

  const oldestMessage = messages[messages.length - 1];

  return {
    createdAt: oldestMessage.createdAt,
    id: oldestMessage.id,
  };
}

export const chatService = {
  list: async (
    room: ChatRoom,
    limit: number,
    cursor: ChatMessageListCursor | null,
  ): Promise<ChatMessageListResult> => {
    const params = chatMessageListParamsSchema.parse({ limit, cursor });

    const { data, error } = await chatRepository.list({
      ...toRoomColumns(room),
      limit: params.limit,
      cursor: params.cursor,
    });
    assertNoError(error);

    const messages = data.map(mapMessageRow);

    return {
      messages,
      nextCursor: buildNextCursor(messages, params.limit),
    };
  },

  send: async (userId: string, room: ChatRoom, body: string): Promise<void> => {
    const validated = sendChatMessageSchema.parse({ body });
    const { jamId, seriesId } = toRoomColumns(room);

    const { error } = await chatRepository.send({
      jam_id: jamId,
      series_id: seriesId,
      sender_id: userId,
      body: validated.body,
    });
    assertNoError(error);
  },

  delete: async (userId: string, messageId: string): Promise<void> => {
    const { error } = await chatRepository.delete(userId, messageId);
    assertNoError(error);
  },
};
