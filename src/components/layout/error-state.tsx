import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
  className?: string;
};

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  icon,
  className,
}: ErrorStateProps): React.JSX.Element {
  return (
    <View className={cn('flex-1 items-center justify-center gap-4 px-6 py-12', className)}>
      {icon !== undefined ? <View className="items-center justify-center">{icon}</View> : null}

      <View className="items-center gap-2">
        <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
        <Text className="text-center text-sm text-muted-foreground">{message}</Text>
      </View>

      {onRetry !== undefined ? (
        <Button
          label={retryLabel ?? 'Try again'}
          variant="outline"
          size="md"
          isLoading={false}
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}
