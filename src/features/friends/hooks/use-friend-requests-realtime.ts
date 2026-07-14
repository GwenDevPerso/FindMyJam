import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/lib/query/keys';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth.store';

type UseFriendRequestsRealtimeOptions = {
  enabled: boolean;
};

export function useFriendRequestsRealtime({ enabled }: UseFriendRequestsRealtimeOptions): void {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  useEffect(() => {
    if (!enabled || userId === null) {
      return;
    }

    const channel = supabase
      .channel(`friends:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests(userId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.friends.list(userId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests(userId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.friends.list(userId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, userId]);
}
