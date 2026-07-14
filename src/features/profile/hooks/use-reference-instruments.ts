import { useQuery } from '@tanstack/react-query';

import { REFERENCE_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { profileService } from '@/services/profile.service';

type UseReferenceInstrumentsOptions = {
  enabled: boolean;
};

export function useReferenceInstruments({ enabled }: UseReferenceInstrumentsOptions) {
  return useQuery({
    queryKey: queryKeys.reference.instruments(),
    queryFn: () => profileService.getReferenceInstruments(),
    staleTime: REFERENCE_STALE_TIME_MS,
    enabled,
  });
}
