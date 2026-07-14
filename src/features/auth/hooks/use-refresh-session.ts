import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export function useRefreshSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.refreshSession(),
    onSuccess: (session) => {
      useAuthStore.getState().setSession(session);
      queryClient.setQueryData(queryKeys.auth.session(), session);
    },
  });
}

export function useAuthSessionQuery() {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: () => authService.getSession(),
    enabled: userId !== null,
    staleTime: Infinity,
  });
}
