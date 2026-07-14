import { Text, View } from 'react-native';

import { getStyleColors } from '@/utils/style-colors';
import { cn } from '@/utils/cn';

type StyleBadgeProps = {
  name: string;
  slug: string;
  size: 'sm' | 'md';
  className?: string;
};

const sizeClasses = {
  sm: 'px-2 py-0.5',
  md: 'px-2.5 py-1',
} as const;

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
} as const;

export function StyleBadge({ name, slug, size, className }: StyleBadgeProps): React.JSX.Element {
  const colors = getStyleColors(slug);

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Style: ${name}`}
      className={cn('rounded-full border', sizeClasses[size], className)}
      style={{ backgroundColor: colors.background, borderColor: colors.border }}>
      <Text className={cn('font-medium', textSizes[size])} style={{ color: colors.text }}>
        {name}
      </Text>
    </View>
  );
}
