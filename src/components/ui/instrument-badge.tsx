import { Text, View } from 'react-native';

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
  md: 'text-sm',
} as const;

export function InstrumentBadge({
  name,
  slug,
  size,
  className,
}: InstrumentBadgeProps): React.JSX.Element {
  const theme = useTheme();
  const Icon = getInstrumentIcon(slug);

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Instrument: ${name}`}
      className={cn(
        'flex-row items-center rounded-full bg-accent/15 border border-accent/25',
        sizeClasses[size],
        className,
      )}>
      <Icon size={iconSizes[size]} color={theme.accent} strokeWidth={2.5} />
      <Text className={cn('font-medium text-accent', textSizes[size])}>{name}</Text>
    </View>
  );
}
