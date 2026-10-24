import { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loading } from '@/components/feedback/loading';
import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Screen } from '@/components/layout/screen';
import { MessageComposer } from '@/features/chat/components/message-composer';
import { MessageList } from '@/features/chat/components/message-list';
import { useChatMessages } from '@/features/chat/hooks/use-chat-messages';
import { useChatRealtime } from '@/features/chat/hooks/use-chat-realtime';
import { useDeleteChatMessage } from '@/features/chat/hooks/use-delete-chat-message';
import { useSendChatMessage } from '@/features/chat/hooks/use-send-chat-message';
import type { ChatRoom } from '@/features/chat/types';
import { getChatRoomForJam } from '@/features/chat/utils/chat-room';
import { useJamDetail } from '@/features/jams/hooks/use-jam-detail';
import { useAuthStore } from '@/store/auth.store';

/** Height of the iOS navigation bar above the screen, below the status bar. */
const IOS_NAVIGATION_BAR_HEIGHT = 44;

type ChatScreenProps = {
  jamId: string;
};

/**
 * Chat room of a jam, open to its creator and participants. A date of a series opens the room of the whole
 * series, shared by the participants of every date.
 */
export function ChatScreen({ jamId }: ChatScreenProps): React.JSX.Element {
  const jamQuery = useJamDetail({ jamId, enabled: jamId.length > 0 });

  if (jamQuery.isLoading) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <Loading message="Loading chat…" size="large" fullScreen={true} />
      </Screen>
    );
  }

  if (jamQuery.isError) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState
          title="Unable to load chat"
          message={jamQuery.error.message}
          onRetry={() => {
            void jamQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const jam = jamQuery.data;

  if (jam === undefined) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState title="Jam not found" message="This jam may have been removed." />
      </Screen>
    );
  }

  if (!jam.isCreator && !jam.isParticipant) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <EmptyState
          title="Join the jam to chat"
          description="Only the creator and the participants can read and write in this chat."
        />
      </Screen>
    );
  }

  return <ChatRoomView jamId={jam.id} seriesId={jam.seriesId} />;
}

type ChatRoomViewProps = {
  jamId: string;
  seriesId: string | null;
};

function ChatRoomView({ jamId, seriesId }: ChatRoomViewProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.userId);
  const room = useMemo((): ChatRoom => getChatRoomForJam({ id: jamId, seriesId }), [jamId, seriesId]);

  const messagesQuery = useChatMessages({ room, enabled: true });
  useChatRealtime({ room, enabled: true });
  const sendMessage = useSendChatMessage({ room });
  const deleteMessage = useDeleteChatMessage({ room });

  const renderMessages = (): React.JSX.Element => {
    if (messagesQuery.isLoading) {
      return <Loading message="Loading messages…" size="large" fullScreen={true} />;
    }

    if (messagesQuery.isError) {
      return (
        <ErrorState
          title="Unable to load messages"
          message={messagesQuery.error?.message ?? 'Something went wrong.'}
          onRetry={messagesQuery.refetch}
        />
      );
    }

    if (messagesQuery.messages.length === 0) {
      return <EmptyState title="No messages yet" description="Say hello to the other musicians." />;
    }

    return (
      <MessageList
        messages={messagesQuery.messages}
        currentUserId={userId}
        hasNextPage={messagesQuery.hasNextPage}
        isFetchingNextPage={messagesQuery.isFetchingNextPage}
        onLoadMore={messagesQuery.fetchNextPage}
        onDeleteMessage={(messageId) => {
          deleteMessage.mutate(messageId);
        }}
      />
    );
  };

  const error = sendMessage.error ?? deleteMessage.error;

  return (
    <Screen scrollable={false} withTabBarInset={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + IOS_NAVIGATION_BAR_HEIGHT : 0}>
        <View className="flex-1">{renderMessages()}</View>

        {error !== null ? <Text className="text-sm text-destructive">{error.message}</Text> : null}

        <MessageComposer
          onSend={async (body) => {
            await sendMessage.mutateAsync(body);
          }}
          isSending={sendMessage.isPending}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
