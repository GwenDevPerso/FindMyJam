import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import { AnimatedPressableScale } from '@/components/ui/animated-pressable';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import type { Notification } from '@/features/notifications/types';
import { formatRelativeTime } from '@/utils/date';
import { cn } from '@/utils/cn';

type NotificationCardProps = {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onDelete?: (notification: Notification) => void;
};

export function NotificationCard({
  notification,
  onPress,
  onDelete,
}: NotificationCardProps): React.JSX.Element {
  const handlePress = (): void => {
    onPress(notification);
  };

  const handleLongPress = (): void => {
    if (onDelete !== undefined) {
      onDelete(notification);
    }
  };

  return (
    <AnimatedPressableScale scaleValue={0.98} onPress={handlePress} onLongPress={handleLongPress}>
      <Card
        variant="elevated"
        className={cn('mb-3 overflow-hidden', !notification.isRead && 'border-primary-text')}>
        <CardHeader className="flex-row items-start gap-3 pb-0">
          <Avatar
            source={notification.imageUrl}
            fallback={notification.title}
            size="md"
          />
          <View className="flex-1">
            <CardTitle className={cn(!notification.isRead && 'text-primary-text')}>
              {notification.title}
            </CardTitle>
            <Text className="mt-1 text-sm text-text-soft">{notification.body}</Text>
            <Text className="mt-2 font-mono text-xs text-muted-foreground">
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </View>
        </CardHeader>
      </Card>
    </AnimatedPressableScale>
  );
}
