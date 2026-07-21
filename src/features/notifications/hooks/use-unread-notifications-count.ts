import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { notificationService } from '@/services/notification.service';
import { useAuthStore } from '@/store/auth.store';

type UseUnreadNotificationsCountOptions = {
  enabled: boolean;
};

export function useUnreadNotificationsCount({ enabled }: UseUnreadNotificationsCountOptions) {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(userId ?? 'anonymous'),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User must be authenticated to fetch unread count');
      }

      return notificationService.getUnreadCount(userId);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null,
  });
}
