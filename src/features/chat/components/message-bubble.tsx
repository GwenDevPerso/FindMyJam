import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import type { ChatMessage } from '@/features/chat/types';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/date';

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  /** Only given for the user's own messages, which they can delete. */
  onLongPress?: () => void;
};

export function MessageBubble({ message, isOwn, onLongPress }: MessageBubbleProps): React.JSX.Element {
  return (
    <View className={cn('flex-row items-end gap-2 py-1', isOwn && 'justify-end')}>
      {!isOwn ? (
        <Avatar source={message.senderAvatarUrl} fallback={message.senderUsername} size="sm" />
      ) : null}

      <Pressable
        accessibilityRole={onLongPress !== undefined ? 'button' : 'text'}
        onLongPress={onLongPress}
        disabled={onLongPress === undefined}
        accessibilityHint={onLongPress !== undefined ? 'Long press to delete' : undefined}
        className={cn(
          'max-w-[80%] gap-1 rounded-xl px-3.5 py-2.5',
          isOwn ? 'rounded-br-sm bg-primary active:opacity-80' : 'rounded-bl-sm border border-border bg-card active:bg-surface-hover',
        )}>
        {!isOwn ? (
          <Text className="font-mono text-xs text-muted-foreground">{message.senderUsername}</Text>
        ) : null}
        <Text className={cn('text-base', isOwn ? 'text-primary-foreground' : 'text-foreground')}>
          {message.body}
        </Text>
        <Text
          className={cn(
            'font-mono text-xs',
            isOwn ? 'text-primary-foreground' : 'text-muted-foreground',
          )}>
          {formatRelativeTime(message.createdAt)}
        </Text>
      </Pressable>
    </View>
  );
}
