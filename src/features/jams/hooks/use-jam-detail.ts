import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';
import { useAuthStore } from '@/store/auth.store';

type UseJamDetailOptions = {
  jamId: string;
  enabled: boolean;
};

export function useJamDetail({ jamId, enabled }: UseJamDetailOptions) {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.jams.detail(jamId),
    queryFn: () => jamService.getById(jamId, userId),
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && jamId.length > 0,
  });
}
