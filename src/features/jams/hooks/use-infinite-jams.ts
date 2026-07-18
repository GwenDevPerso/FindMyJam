import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import type { JamListCursor, JamListFilters } from '@/features/jams/types';
import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';
import type { Jam } from '@/types/domain';

export const ALL_JAMS_PAGE_SIZE = 20;

type UseInfiniteJamsOptions = {
  filters: Partial<JamListFilters>;
  enabled: boolean;
};

type UseInfiniteJamsResult = {
  jams: Jam[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isRefetching: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
};

export function useInfiniteJams({ filters, enabled }: UseInfiniteJamsOptions): UseInfiniteJamsResult {
  const queryFilters = useMemo(
    (): Partial<JamListFilters> => ({
      ...filters,
      limit: filters.limit ?? ALL_JAMS_PAGE_SIZE,
    }),
    [filters],
  );

  const query = useInfiniteQuery({
    queryKey: queryKeys.jams.infinite(queryFilters),
    queryFn: ({ pageParam }) =>
      jamService.list({
        ...queryFilters,
        cursor: pageParam as JamListCursor | null,
      }),
    initialPageParam: null as JamListCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: DEFAULT_STALE_TIME_MS,
  });

  const jams = useMemo((): Jam[] => {
    if (query.data === undefined) {
      return [];
    }

    const seenIds = new Set<string>();

    return query.data.pages.flatMap((page) =>
      page.jams.filter((jam) => {
        if (seenIds.has(jam.id)) {
          return false;
        }

        seenIds.add(jam.id);
        return true;
      }),
    );
  }, [query.data]);

  return {
    jams,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefetching: query.isRefetching,
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
