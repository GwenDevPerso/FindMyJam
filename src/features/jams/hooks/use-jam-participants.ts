import { useQuery } from '@tanstack/react-query';

import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';

type UseJamParticipantsOptions = {
  jamId: string;
  enabled: boolean;
};

export function useJamParticipants({ jamId, enabled }: UseJamParticipantsOptions) {
  return useQuery({
    queryKey: queryKeys.jams.participants(jamId),
    queryFn: () => jamService.getParticipants(jamId),
    staleTime: DEFAULT_STALE_TIME_MS,
    enabled: enabled && jamId.length > 0,
  });
}
