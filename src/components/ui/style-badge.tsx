import { View } from 'react-native';

import { Text } from '@/components/ui/text';
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

// DESIGN.md §5: styles are neutral tags (mono label + 1px borderStrong), not one colour per style.
export function StyleBadge({ name, size, className }: StyleBadgeProps): React.JSX.Element {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Style: ${name}`}
      className={cn('rounded-sm border border-border-strong', sizeClasses[size], className)}>
      <Text className="font-mono text-xs font-semibold uppercase tracking-label text-text-soft">{name}</Text>
    </View>
  );
}
