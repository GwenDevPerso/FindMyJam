import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ChatRoom } from '@/features/chat/types';
import { getChatRoomKey } from '@/features/chat/utils/chat-room';
import { queryKeys } from '@/lib/query/keys';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';

type UseDeleteChatMessageOptions = {
  room: ChatRoom;
};

export function useDeleteChatMessage({ room }: UseDeleteChatMessageOptions) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (messageId: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to delete a message');
      }

      return chatService.delete(userId, messageId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(getChatRoomKey(room)) });
    },
  });
}
