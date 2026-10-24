import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateJamSeriesInput } from '@/features/jams/types';
import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';
import { useAuthStore } from '@/store/auth.store';

type UpdateJamSeriesVariables = {
  seriesId: string;
  input: UpdateJamSeriesInput;
};

export function useUpdateJamSeries() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: ({ seriesId, input }: UpdateJamSeriesVariables) => {
      if (userId === null) {
        throw new Error('User must be authenticated to update a jam');
      }

      return jamService.updateSeries(userId, seriesId, input);
    },
    onSuccess: () => {
      // Every upcoming date of the series changed: their details, the lists, the map and the profile lists.
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jams.infinites() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.map.all });
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.createdJams(userId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.jams(userId) });
      }
    },
  });
}
