import { useQuery } from '@tanstack/react-query';

import type { Coordinates } from '@/types/geo';
import { REFERENCE_STALE_TIME_MS } from '@/constants/query-config';
import { useDebounce } from '@/hooks/use-debounce';
import { queryKeys } from '@/lib/query/keys';
import { geocodingService } from '@/services/geocoding.service';
import { MAP_FILTER_DEBOUNCE_MS } from '@/features/map/constants';

type UsePlaceSearchOptions = {
  query: string;
  proximity: Coordinates | null;
  enabled: boolean;
};

function buildProximityKey(proximity: Coordinates | null): string {
  if (proximity === null) {
    return 'none';
  }

  return `${proximity.latitude.toFixed(4)},${proximity.longitude.toFixed(4)}`;
}

export function usePlaceSearch({ query, proximity, enabled }: UsePlaceSearchOptions) {
  const debouncedQuery = useDebounce(query, MAP_FILTER_DEBOUNCE_MS);
  const minQueryLength = geocodingService.getMinQueryLength();
  const trimmedQuery = debouncedQuery.trim();
  const proximityKey = buildProximityKey(proximity);

  return useQuery({
    queryKey: queryKeys.location.search(trimmedQuery, proximityKey),
    queryFn: () =>
      geocodingService.searchPlaces({
        query: trimmedQuery,
        proximity,
        limit: geocodingService.getDefaultSearchLimit(),
      }),
    enabled: enabled && trimmedQuery.length >= minQueryLength,
    staleTime: REFERENCE_STALE_TIME_MS,
  });
}
