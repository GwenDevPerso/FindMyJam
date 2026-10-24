import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import type { ChatMessage, ChatMessageListCursor, ChatRoom } from '@/features/chat/types';
import { getChatRoomKey } from '@/features/chat/utils/chat-room';
import { DEFAULT_STALE_TIME_MS } from '@/constants/query-config';
import { queryKeys } from '@/lib/query/keys';
import { chatService } from '@/services/chat.service';

export const CHAT_MESSAGES_PAGE_SIZE = 30;

type UseChatMessagesOptions = {
  room: ChatRoom;
  enabled: boolean;
};

type UseChatMessagesResult = {
  /** Newest first, as shown by an inverted list. */
  messages: ChatMessage[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
};

export function useChatMessages({ room, enabled }: UseChatMessagesOptions): UseChatMessagesResult {
  const query = useInfiniteQuery({
    queryKey: queryKeys.chat.messages(getChatRoomKey(room)),
    queryFn: ({ pageParam }) => chatService.list(room, CHAT_MESSAGES_PAGE_SIZE, pageParam),
    initialPageParam: null as ChatMessageListCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: DEFAULT_STALE_TIME_MS,
  });

  const messages = useMemo((): ChatMessage[] => {
    if (query.data === undefined) {
      return [];
    }

    const seenIds = new Set<string>();

    return query.data.pages.flatMap((page) =>
      page.messages.filter((message) => {
        if (seenIds.has(message.id)) {
          return false;
        }

        seenIds.add(message.id);
        return true;
      }),
    );
  }, [query.data]);

  return {
    messages,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
    refetch: () => {
      void query.refetch();
    },
  };
}
