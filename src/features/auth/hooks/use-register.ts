import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { RegisterInput } from '@/features/auth/types';
import { queryKeys } from '@/lib/query/keys';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => authService.signUp(input),
    onSuccess: (session) => {
      useAuthStore.getState().setSession(session);
      queryClient.setQueryData(queryKeys.auth.session(), session);
    },
  });
}
