import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { LoginInput } from '@/features/auth/types';
import { queryKeys } from '@/lib/query/keys';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.signIn(input),
    onSuccess: (session) => {
      useAuthStore.getState().setSession(session);
      queryClient.setQueryData(queryKeys.auth.session(), session);
    },
  });
}
