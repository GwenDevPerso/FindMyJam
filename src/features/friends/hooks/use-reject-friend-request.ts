import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';
import { friendService } from '@/services/friend.service';
import { useAuthStore } from '@/store/auth.store';

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (friendshipId: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to reject a friend request');
      }

      return friendService.rejectRequest(userId, friendshipId);
    },
    onSuccess: () => {
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests(userId) });
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}
