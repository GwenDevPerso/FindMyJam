import { useQuery } from '@tanstack/react-query';

import type { JamListFilters } from '@/features/jams/types';
import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';

type UseJamsOptions = {
  filters?: Partial<JamListFilters>;
  enabled: boolean;
};

export function useJams({ filters, enabled }: UseJamsOptions) {
  const queryFilters = filters ?? {};

  return useQuery({
    queryKey: queryKeys.jams.list(queryFilters),
    queryFn: () => jamService.list(queryFilters),
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled,
  });
}
