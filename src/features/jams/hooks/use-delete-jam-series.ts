import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { jamService } from '@/services/jam.service';
import { useAuthStore } from '@/store/auth.store';

export function useDeleteJamSeries() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (seriesId: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to delete a jam');
      }

      return jamService.deleteSeries(userId, seriesId);
    },
    onSuccess: () => {
      // Every upcoming date of the series is gone: their details, the lists, the map and the profile lists.
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
