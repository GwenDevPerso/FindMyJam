import { QueryClient } from '@tanstack/react-query';

import { DEFAULT_GC_TIME_MS, DEFAULT_STALE_TIME_MS } from '@/constants/query-config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      gcTime: DEFAULT_GC_TIME_MS,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
