import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { profileService } from '@/services/profile.service';

type UseProfileOptions = {
  userId: string | null;
  enabled: boolean;
};

export function useProfile({ userId, enabled }: UseProfileOptions) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(userId ?? ''),
    queryFn: () => {
      if (userId === null) {
        throw new Error('User ID is required to fetch profile');
      }

      return profileService.getById(userId);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && userId !== null,
  });
}
