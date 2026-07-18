import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { participationService } from '@/services/participation.service';
import { useAuthStore } from '@/store/auth.store';

export function useJoinJam() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (jamId: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to join a jam');
      }

      return participationService.join(userId, jamId);
    },
    onSuccess: (_data, jamId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.detail(jamId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.participants(jamId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.infinites() });
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.participatedJams(userId) });
      }
    },
  });
}
