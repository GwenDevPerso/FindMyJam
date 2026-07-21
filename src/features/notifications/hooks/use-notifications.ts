import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { NotificationListCursor } from '@/features/notifications/types';
import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { notificationService } from '@/services/notification.service';
import { useAuthStore } from '@/store/auth.store';

const DEFAULT_PAGE_SIZE = 20;

type UseNotificationsOptions = {
  enabled: boolean;
  pageSize?: number;
};

export function useNotifications({ enabled, pageSize = DEFAULT_PAGE_SIZE }: UseNotificationsOptions) {
  const userId = useAuthStore((state) => state.userId);

  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(userId ?? 'anonymous'),
    queryFn: ({ pageParam }: { pageParam: NotificationListCursor | null }) => {
      if (userId === null) {
        throw new Error('User must be authenticated to fetch notifications');
      }

      return notificationService.list(userId, pageSize, pageParam);
    },
    initialPageParam: null as NotificationListCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to mark notification as read');
      }

      return notificationService.markAsRead(userId, notificationId);
    },
    onSuccess: () => {
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: () => {
      if (userId === null) {
        throw new Error('User must be authenticated to mark all notifications as read');
      }

      return notificationService.markAllAsRead(userId);
    },
    onSuccess: () => {
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
      }
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to delete notification');
      }

      return notificationService.delete(userId, notificationId);
    },
    onSuccess: () => {
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(userId) });
      }
    },
  });
}
