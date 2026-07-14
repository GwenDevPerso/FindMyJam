import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateJamInput } from '@/features/jams/types';
import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';
import { useAuthStore } from '@/store/auth.store';

type UpdateJamVariables = {
  jamId: string;
  input: UpdateJamInput;
};

export function useUpdateJam() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: ({ jamId, input }: UpdateJamVariables) => {
      if (userId === null) {
        throw new Error('User must be authenticated to update a jam');
      }

      return jamService.update(userId, jamId, input);
    },
    onSuccess: (jam) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.detail(jam.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.lists() });
    },
  });
}
