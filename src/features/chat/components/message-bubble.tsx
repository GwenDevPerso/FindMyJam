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
          'max-w-[80%] gap-1 border px-3 py-2',
          isOwn ? 'border-primary bg-primary' : 'border-border bg-card',
        )}>
        {!isOwn ? (
          <Text className="text-xs font-semibold text-secondary-foreground">{message.senderUsername}</Text>
        ) : null}
        <Text className={cn('text-sm', isOwn ? 'text-primary-foreground' : 'text-secondary-foreground')}>
          {message.body}
        </Text>
        <Text
          className={cn(
            'text-xs',
            isOwn ? 'text-primary-foreground opacity-80' : 'text-muted-foreground',
          )}>
          {formatRelativeTime(message.createdAt)}
        </Text>
      </Pressable>
    </View>
  );
}
