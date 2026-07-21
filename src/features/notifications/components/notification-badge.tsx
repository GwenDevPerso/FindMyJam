import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

type NotificationBadgeProps = {
  count: number;
  className?: string;
};

export function NotificationBadge({ count, className }: NotificationBadgeProps): React.JSX.Element | null {
  if (count <= 0) {
    return null;
  }

  const displayCount = count > 99 ? '99+' : String(count);

  return (
    <View
      accessibilityLabel={`${count} unread notifications`}
      className={cn(
        'absolute -right-1 -top-1 min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1',
        className,
      )}>
      <Text className="text-[10px] font-bold text-destructive-foreground">{displayCount}</Text>
    </View>
  );
}
