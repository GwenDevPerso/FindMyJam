import { useQuery } from '@tanstack/react-query';

import { REFERENCE_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { profileService } from '@/services/profile.service';

type UseReferenceMusicStylesOptions = {
  enabled: boolean;
};

export function useReferenceMusicStyles({ enabled }: UseReferenceMusicStylesOptions) {
  return useQuery({
    queryKey: queryKeys.reference.musicStyles(),
    queryFn: () => profileService.getReferenceMusicStyles(),
    staleTime: REFERENCE_STALE_TIME_MS,
    enabled,
  });
}
