import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { friendService } from '@/services/friend.service';
import { useAuthStore } from '@/store/auth.store';

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (addresseeId: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to send a friend request');
      }

      return friendService.sendRequest(userId, addresseeId);
    },
    onSuccess: () => {
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests(userId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.friends.list(userId) });
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}
