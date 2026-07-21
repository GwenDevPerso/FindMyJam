import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateNotificationPreferencesInput } from '@/features/notifications/types';
import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { notificationService } from '@/services/notification.service';
import { useAuthStore } from '@/store/auth.store';

type UseNotificationPreferencesOptions = {
  enabled: boolean;
};

export function useNotificationPreferences({ enabled }: UseNotificationPreferencesOptions) {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.notifications.preferences(userId ?? 'anonymous'),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User must be authenticated to fetch notification preferences');
      }

      return notificationService.getPreferences(userId);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (input: UpdateNotificationPreferencesInput) => {
      if (userId === null) {
        throw new Error('User must be authenticated to update notification preferences');
      }

      return notificationService.updatePreferences(userId, input);
    },
    onSuccess: () => {
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences(userId) });
      }
    },
  });
}
