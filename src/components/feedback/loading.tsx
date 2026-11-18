import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui/text';
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
      <ActivityIndicator size={size} color={theme.primaryText} />
      {message !== undefined ? (
        <Text className="text-xs text-muted-foreground">{message}</Text>
      ) : null}
    </View>
  );
}
