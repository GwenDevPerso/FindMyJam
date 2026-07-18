import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateJamInput } from '@/features/jams/types';
import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';
import { useAuthStore } from '@/store/auth.store';

export function useCreateJam() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (input: CreateJamInput) => {
      if (userId === null) {
        throw new Error('User must be authenticated to create a jam');
      }

      return jamService.create(userId, input);
    },
    onSuccess: (jam) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.infinites() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.map.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.createdJams(jam.creatorId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.jams(jam.creatorId) });
    },
  });
}
