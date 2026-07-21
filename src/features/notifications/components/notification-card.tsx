import { Text, View } from 'react-native';

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
        className={cn('mb-3 overflow-hidden', !notification.isRead && 'border-primary/30')}>
        {!notification.isRead ? (
          <View className="absolute left-0 top-0 h-full w-1 bg-primary" accessibilityElementsHidden />
        ) : null}

        <CardHeader className="flex-row items-start gap-3 pb-0 pl-2">
          <Avatar
            source={notification.imageUrl}
            fallback={notification.title}
            size="md"
          />
          <View className="flex-1">
            <CardTitle className={cn(!notification.isRead && 'text-primary')}>
              {notification.title}
            </CardTitle>
            <Text className="mt-1 text-sm text-muted-foreground">{notification.body}</Text>
            <Text className="mt-2 text-xs text-muted-foreground">
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </View>
        </CardHeader>
      </Card>
    </AnimatedPressableScale>
  );
}
