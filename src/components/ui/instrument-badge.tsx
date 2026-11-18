import { createElement } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { getInstrumentIcon } from '@/utils/instrument-icons';
import { cn } from '@/utils/cn';

type InstrumentBadgeProps = {
  name: string;
  slug: string;
  size: 'sm' | 'md';
  className?: string;
};

const sizeClasses = {
  sm: 'px-2 py-0.5 gap-1',
  md: 'px-2.5 py-1 gap-1.5',
} as const;

const iconSizes = {
  sm: 12,
  md: 14,
} as const;

const textSizes = {
  sm: 'text-xs',
  md: 'text-xs',
} as const;

export function InstrumentBadge({
  name,
  slug,
  size,
  className,
}: InstrumentBadgeProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Instrument: ${name}`}
      className={cn(
        'flex-row items-center border border-accent bg-transparent',
        sizeClasses[size],
        className,
      )}>
      {createElement(getInstrumentIcon(slug), {
        size: iconSizes[size],
        color: theme.accent,
        strokeWidth: 2,
      })}
      <Text className={cn('font-medium text-accent', textSizes[size])}>{name}</Text>
    </View>
  );
}
