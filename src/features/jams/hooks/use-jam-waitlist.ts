import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { participationService } from '@/services/participation.service';
import { useAuthStore } from '@/store/auth.store';

type UseJamWaitlistOptions = {
  jamId: string;
  enabled: boolean;
};

export function useJamWaitlist({ jamId, enabled }: UseJamWaitlistOptions) {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.jams.waitlist(jamId),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User must be authenticated to read the waitlist');
      }

      return participationService.getWaitlistStatus(userId, jamId);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null && jamId.length > 0,
  });
}
