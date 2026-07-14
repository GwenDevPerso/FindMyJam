import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = {
  source?: string | null;
  fallback: string;
  size: AvatarSize;
  className?: string;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

const textSizeClasses: Record<AvatarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
};

function getFallbackLabel(fallback: string): string {
  const trimmed = fallback.trim();

  if (trimmed.length === 0) {
    return '?';
  }

  return trimmed.charAt(0).toUpperCase();
}

export function Avatar({ source, fallback, size, className }: AvatarProps): React.JSX.Element {
  const hasSource = source !== undefined && source !== null && source.length > 0;

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden rounded-full bg-secondary',
        sizeClasses[size],
        className,
      )}>
      {hasSource ? (
        <Image
          accessibilityLabel={fallback}
          source={{ uri: source }}
          contentFit="cover"
          className="h-full w-full"
        />
      ) : (
        <Text className={cn('font-semibold text-secondary-foreground', textSizeClasses[size])}>
          {getFallbackLabel(fallback)}
        </Text>
      )}
    </View>
  );
}
