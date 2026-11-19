import { View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/utils/cn';

export type CardVariant = 'default' | 'elevated' | 'interactive';

type CardProps = ViewProps & {
  className?: string;
  variant?: CardVariant;
};

type CardTextProps = {
  children: string;
  className?: string;
};

// DESIGN.md §5: a `surface` with a 1px `border`, radius 18–24; no grey shadow.
const variantClasses: Record<CardVariant, string> = {
  default: 'border border-border bg-card',
  elevated: 'border border-border bg-card-elevated',
  // No `active:` here: on a View, NativeWind turns it into a Pressable that swallows the parent's press.
  interactive: 'border border-border bg-card-elevated',
};

export function Card({ children, className, variant = 'default', ...viewProps }: CardProps): React.JSX.Element {
  return (
    <View className={cn('rounded-xl p-4', variantClasses[variant], className)} {...viewProps}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className, ...viewProps }: ViewProps & { className?: string }): React.JSX.Element {
  return (
    <View className={cn('gap-1.5 pb-3', className)} {...viewProps}>
      {children}
    </View>
  );
}

export function CardTitle({ children, className }: CardTextProps): React.JSX.Element {
  return <Text className={cn('text-lg font-bold text-card-foreground', className)}>{children}</Text>;
}

export function CardDescription({ children, className }: CardTextProps): React.JSX.Element {
  return <Text className={cn('text-sm text-text-soft', className)}>{children}</Text>;
}

export function CardContent({ children, className, ...viewProps }: ViewProps & { className?: string }): React.JSX.Element {
  return (
    <View className={cn('gap-3', className)} {...viewProps}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className, ...viewProps }: ViewProps & { className?: string }): React.JSX.Element {
  return (
    <View className={cn('flex-row items-center gap-2 pt-3', className)} {...viewProps}>
      {children}
    </View>
  );
}
