import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth.store';

type UseNotificationsRealtimeOptions = {
  enabled: boolean;
};

export function useNotificationsRealtime({ enabled }: UseNotificationsRealtimeOptions): void {
  const userId = useAuthStore((state) => state.userId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || userId === null) {
      return;
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, userId]);
}
