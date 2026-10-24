import type { ChatMessage } from '@/types/domain';

export type { ChatMessage };

/**
 * Chat room of a jam: a date of a series talks in the room of its series (shared by every date), a one-off jam
 * has its own room.
 */
export type ChatRoom = { kind: 'series'; seriesId: string } | { kind: 'jam'; jamId: string };

export type ChatMessageListCursor = {
  createdAt: string;
  id: string;
};

export type ChatMessageListResult = {
  /** Newest first. */
  messages: ChatMessage[];
  nextCursor: ChatMessageListCursor | null;
};
