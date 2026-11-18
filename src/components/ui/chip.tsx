import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { Glow } from '@/constants/theme';
import { cn } from '@/utils/cn';

export type ChipVariant = 'filter' | 'segment';

type ChipProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant: ChipVariant;
  isSelected: boolean;
  className?: string;
};

// DESIGN.md §4: pills, 36 high (hitSlop brings the touch target to 44). A filter selected = cyan outline and text;
// a segment selected = pink fill with glow inside a `surface` track.
const variantClasses: Record<ChipVariant, { selected: string; idle: string }> = {
  filter: {
    selected: 'border border-accent bg-card',
    idle: 'border border-border-strong bg-card active:bg-surface-hover',
  },
  segment: {
    selected: 'bg-primary',
    idle: 'bg-transparent active:bg-surface-hover',
  },
};

const textClasses: Record<ChipVariant, { selected: string; idle: string }> = {
  filter: { selected: 'text-accent', idle: 'text-text-soft' },
  segment: { selected: 'text-primary-foreground', idle: 'text-text-soft' },
};

export function Chip({ label, variant, isSelected, className, ...pressableProps }: ChipProps): React.JSX.Element {
  const state = isSelected ? 'selected' : 'idle';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      hitSlop={4}
      className={cn('min-h-9 items-center justify-center rounded-full px-3', variantClasses[variant][state], className)}
      style={variant === 'segment' && isSelected ? styles.glow : undefined}
      {...pressableProps}>
      <Text className={cn('font-mono text-xs font-semibold', textClasses[variant][state])}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glow: { boxShadow: Glow.primary },
});
