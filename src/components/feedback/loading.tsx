import { ActivityIndicator, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/utils/cn';

type LoadingProps = {
  message?: string;
  size: 'small' | 'large';
  fullScreen: boolean;
  className?: string;
};

export function Loading({ message, size, fullScreen, className }: LoadingProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      className={cn(
        'items-center justify-center gap-3',
        fullScreen && 'flex-1 bg-background',
        className,
      )}>
      <ActivityIndicator size={size} color={theme.primary} />
      {message !== undefined ? (
        <Text className="text-sm text-muted-foreground">{message}</Text>
      ) : null}
    </View>
  );
}
