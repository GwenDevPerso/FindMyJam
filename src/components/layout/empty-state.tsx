import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View className={cn('flex-1 items-center justify-center gap-4 px-6 py-12', className)}>
      {icon !== undefined ? <View className="items-center justify-center">{icon}</View> : null}

      <View className="items-center gap-2">
        <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
        {description !== undefined ? (
          <Text className="text-center text-sm text-muted-foreground">{description}</Text>
        ) : null}
      </View>

      {action !== undefined ? <View className="mt-2">{action}</View> : null}
    </View>
  );
}
