import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'default' | 'primary' | 'accent' | 'event' | 'outline' | 'skill' | 'solid';
export type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  label: string;
  variant: BadgeVariant;
  size: BadgeSize;
  className?: string;
};

// DESIGN.md §5 tags: mono label text, colour + text, never colour alone. neutral (default / outline / skill), info
// (accent, cyan), action (primary, pink), success (event, green), solid (pink fill).
const variantClasses: Record<BadgeVariant, string> = {
  default: 'border border-border-strong bg-secondary',
  primary: 'border border-primary-text bg-transparent',
  accent: 'border border-accent bg-transparent',
  event: 'border border-event bg-transparent',
  outline: 'border border-border-strong bg-transparent',
  skill: 'border border-border-strong bg-transparent',
  solid: 'bg-primary',
};

const variantTextClasses: Record<BadgeVariant, string> = {
  default: 'text-text-soft',
  primary: 'text-primary-text',
  accent: 'text-accent',
  event: 'text-event',
  outline: 'text-foreground',
  skill: 'text-text-soft',
  solid: 'text-primary-foreground',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5',
  md: 'px-2.5 py-1',
};

export function Badge({ label, variant, size, className }: BadgeProps): React.JSX.Element {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      className={cn('rounded-sm', variantClasses[variant], sizeClasses[size], className)}>
      <Text className={cn('font-mono text-xs font-semibold uppercase tracking-label', variantTextClasses[variant])}>
        {label}
      </Text>
    </View>
  );
}

type BadgeGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export function BadgeGroup({ children, className }: BadgeGroupProps): React.JSX.Element {
  return <View className={cn('flex-row flex-wrap gap-1.5', className)}>{children}</View>;
}
