import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { friendService } from '@/services/friend.service';
import { useAuthStore } from '@/store/auth.store';

type UseFriendRequestsOptions = {
  enabled: boolean;
};

export function useFriendRequests({ enabled }: UseFriendRequestsOptions) {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.friends.requests(userId ?? ''),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User must be authenticated to list friend requests');
      }

      return friendService.listIncomingRequests(userId);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null,
  });
}
