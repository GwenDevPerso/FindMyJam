import type { ChatRoom } from '@/features/chat/types';
import type { Jam } from '@/types/domain';

/** Room of a jam: its series' room for a date of a series, its own room for a one-off jam. */
export function getChatRoomForJam(jam: Pick<Jam, 'id' | 'seriesId'>): ChatRoom {
  if (jam.seriesId !== null) {
    return { kind: 'series', seriesId: jam.seriesId };
  }

  return { kind: 'jam', jamId: jam.id };
}

/** Stable string identifying a room, used in query keys and realtime channel names. */
export function getChatRoomKey(room: ChatRoom): string {
  return room.kind === 'series' ? `series:${room.seriesId}` : `jam:${room.jamId}`;
}
