import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { ChatRoom } from '@/features/chat/types';
import { getChatRoomKey } from '@/features/chat/utils/chat-room';
import { queryKeys } from '@/lib/query/keys';
import { supabase } from '@/services/supabase';

type UseChatRealtimeOptions = {
  room: ChatRoom;
  enabled: boolean;
};

/**
 * Refreshes a room's messages when one is posted. Realtime applies the `jam_messages` RLS policies, so only the
 * room's members receive the events. Deletions by others show on the next refetch: realtime cannot filter
 * DELETE events by room.
 */
export function useChatRealtime({ room, enabled }: UseChatRealtimeOptions): void {
  const queryClient = useQueryClient();
  const roomKey = getChatRoomKey(room);
  const filter = room.kind === 'series' ? `series_id=eq.${room.seriesId}` : `jam_id=eq.${room.jamId}`;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = supabase
      .channel(`chat:${roomKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jam_messages',
          filter,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(roomKey) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, filter, queryClient, roomKey]);
}
