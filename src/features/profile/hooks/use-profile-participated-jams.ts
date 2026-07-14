import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { profileService } from '@/services/profile.service';

type UseProfileParticipatedJamsOptions = {
  userId: string | null;
  enabled: boolean;
};

export function useProfileParticipatedJams({ userId, enabled }: UseProfileParticipatedJamsOptions) {
  return useQuery({
    queryKey: queryKeys.profiles.participatedJams(userId ?? ''),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User ID is required to fetch participated jams');
      }

      return profileService.getParticipatedJams(userId);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null,
  });
}
