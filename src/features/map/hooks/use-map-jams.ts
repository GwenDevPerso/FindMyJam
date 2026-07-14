import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import { MAP_FILTER_DEBOUNCE_MS } from '@/features/map/constants';
import type { MapJamMarker, MapSearchParams } from '@/features/map/types';
import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { useDebounce } from '@/hooks/use-debounce';
import { queryKeys } from '@/lib/query/keys';
import { mapService } from '@/services/map.service';
import type { JamListCursor } from '@/features/jams/types';

type UseMapJamsOptions = {
  searchParams: MapSearchParams;
  enabled: boolean;
};

type UseMapJamsResult = {
  markers: MapJamMarker[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
};

export function useMapJams({ searchParams, enabled }: UseMapJamsOptions): UseMapJamsResult {
  const debouncedRadiusMeters = useDebounce(searchParams.radiusMeters, MAP_FILTER_DEBOUNCE_MS);

  const debouncedSearchParams = useMemo(
    (): MapSearchParams => ({
      ...searchParams,
      radiusMeters: debouncedRadiusMeters,
    }),
    [searchParams, debouncedRadiusMeters],
  );

  const query = useInfiniteQuery({
    queryKey: queryKeys.map.jams(debouncedSearchParams),
    queryFn: ({ pageParam }) =>
      mapService.searchJams(debouncedSearchParams, pageParam as JamListCursor | null),
    initialPageParam: null as JamListCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: DEFAULT_STALE_TIME_MS,
  });

  const markers = useMemo((): MapJamMarker[] => {
    if (query.data === undefined) {
      return [];
    }

    const seenIds = new Set<string>();

    return query.data.pages.flatMap((page) =>
      page.markers.filter((marker) => {
        if (seenIds.has(marker.id)) {
          return false;
        }

        seenIds.add(marker.id);
        return true;
      }),
    );
  }, [query.data]);

  return {
    markers,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
    refetch: () => {
      void query.refetch();
    },
  };
}
