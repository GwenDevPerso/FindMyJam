import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import type { SearchUsersInput } from '@/features/friends/types';
import { queryKeys } from '@/lib/query/keys';
import { friendService } from '@/services/friend.service';
import { useAuthStore } from '@/store/auth.store';

type UseSearchUsersOptions = {
  input: SearchUsersInput;
  enabled: boolean;
};

export function useSearchUsers({ input, enabled }: UseSearchUsersOptions) {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.friends.search(input.query),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User must be authenticated to search users');
      }

      return friendService.searchUsers(userId, input);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null && input.query.trim().length >= 2,
  });
}
