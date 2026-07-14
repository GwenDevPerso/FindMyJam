import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

export type BadgeVariant = 'default' | 'primary' | 'accent' | 'event' | 'outline' | 'skill' | 'solid';
export type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  label: string;
  variant: BadgeVariant;
  size: BadgeSize;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-secondary',
  primary: 'bg-primary/15 border border-primary/30',
  accent: 'bg-accent/15 border border-accent/30',
  event: 'bg-event/15 border border-event/30',
  outline: 'bg-transparent border border-border',
  skill: 'bg-muted border border-border',
  solid: 'bg-primary border border-primary',
};

const variantTextClasses: Record<BadgeVariant, string> = {
  default: 'text-secondary-foreground',
  primary: 'text-primary',
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
  md: 'text-sm',
};

export function Badge({ label, variant, size, className }: BadgeProps): React.JSX.Element {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      className={cn('rounded-full', variantClasses[variant], sizeClasses[size], className)}>
      <Text className={cn('font-medium', variantTextClasses[variant], sizeTextClasses[size])}>{label}</Text>
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
