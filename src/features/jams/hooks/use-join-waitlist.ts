import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { participationService } from '@/services/participation.service';
import { useAuthStore } from '@/store/auth.store';

export function useJoinWaitlist() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (jamId: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to join a waitlist');
      }

      return participationService.joinWaitlist(userId, jamId);
    },
    onSuccess: (_data, jamId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.waitlist(jamId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.detail(jamId) });
    },
  });
}
