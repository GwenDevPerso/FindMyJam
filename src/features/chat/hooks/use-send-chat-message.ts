import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ChatRoom } from '@/features/chat/types';
import { getChatRoomKey } from '@/features/chat/utils/chat-room';
import { queryKeys } from '@/lib/query/keys';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';

type UseSendChatMessageOptions = {
  room: ChatRoom;
};

export function useSendChatMessage({ room }: UseSendChatMessageOptions) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (body: string) => {
      if (userId === null) {
        throw new Error('User must be authenticated to send a message');
      }

      return chatService.send(userId, room, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(getChatRoomKey(room)) });
    },
  });
}
