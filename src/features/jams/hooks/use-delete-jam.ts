import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';
import { useAuthStore } from '@/store/auth.store';

export function useDeleteJam() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (jamId: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to delete a jam');
      }

      return jamService.delete(userId, jamId);
    },
    onSuccess: (_data, jamId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.detail(jamId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.lists() });
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.createdJams(userId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.jams(userId) });
      }
    },
  });
}
