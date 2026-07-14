import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { profileService } from '@/services/profile.service';

type UseProfileCreatedJamsOptions = {
  userId: string | null;
  enabled: boolean;
};

export function useProfileCreatedJams({ userId, enabled }: UseProfileCreatedJamsOptions) {
  return useQuery({
    queryKey: queryKeys.profiles.createdJams(userId ?? ''),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User ID is required to fetch created jams');
      }

      return profileService.getCreatedJams(userId);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null,
  });
}
