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

// Square tags with a 1px line; `primary` uses primary-text (the accent in dark, text in light: DESIGN.md §2).
const variantClasses: Record<BadgeVariant, string> = {
  default: 'border border-border bg-secondary',
  primary: 'border border-primary-text bg-transparent',
  accent: 'border border-accent bg-transparent',
  event: 'border border-event bg-transparent',
  outline: 'border border-border bg-transparent',
  skill: 'border border-border bg-transparent',
  solid: 'border border-primary bg-primary',
};

const variantTextClasses: Record<BadgeVariant, string> = {
  default: 'text-secondary-foreground',
  primary: 'text-primary-text',
  accent: 'text-accent',
  event: 'text-event',
  outline: 'text-foreground',
  skill: 'text-muted-foreground',
  solid: 'text-primary-foreground',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
};

const sizeTextClasses: Record<BadgeSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
};

export function Badge({ label, variant, size, className }: BadgeProps): React.JSX.Element {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      className={cn(variantClasses[variant], sizeClasses[size], className)}>
      <Text className={cn('font-medium uppercase tracking-label', variantTextClasses[variant], sizeTextClasses[size])}>{label}</Text>
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
