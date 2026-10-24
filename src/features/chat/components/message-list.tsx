import { Alert, FlatList } from 'react-native';

import { Loading } from '@/components/feedback/loading';
import { MessageBubble } from '@/features/chat/components/message-bubble';
import type { ChatMessage } from '@/features/chat/types';

type MessageListProps = {
  /** Newest first: the list is inverted, so the newest message sits at the bottom. */
  messages: ChatMessage[];
  currentUserId: string | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onDeleteMessage: (messageId: string) => void;
};

export function MessageList({
  messages,
  currentUserId,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onDeleteMessage,
}: MessageListProps): React.JSX.Element {
  const confirmDelete = (messageId: string): void => {
    Alert.alert('Delete message?', 'It will be removed for everyone in this chat.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDeleteMessage(messageId);
        },
      },
    ]);
  };

  return (
    <FlatList
      accessibilityLabel="Messages"
      data={messages}
      inverted={true}
      keyExtractor={(message) => message.id}
      contentContainerClassName="py-2"
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => {
        const isOwn = item.senderId === currentUserId;

        return (
          <MessageBubble
            message={item}
            isOwn={isOwn}
            onLongPress={
              isOwn
                ? () => {
                    confirmDelete(item.id);
                  }
                : undefined
            }
          />
        );
      }}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingNextPage ? <Loading size="small" fullScreen={false} className="py-3" /> : null
      }
    />
  );
}
