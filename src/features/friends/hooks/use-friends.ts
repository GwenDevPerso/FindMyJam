import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { friendService } from '@/services/friend.service';
import { useAuthStore } from '@/store/auth.store';

type UseFriendsOptions = {
  enabled: boolean;
};

export function useFriends({ enabled }: UseFriendsOptions) {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.friends.list(userId ?? ''),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User must be authenticated to list friends');
      }

      return friendService.listAccepted(userId);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null,
  });
}
