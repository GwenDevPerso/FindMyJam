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

// DESIGN.md §4: no elevation — every card is a surface with a 1px border line.
const variantClasses: Record<CardVariant, string> = {
  default: 'border border-border bg-card',
  elevated: 'border border-border bg-card-elevated',
  interactive: 'border border-border bg-card-elevated',
};

export function Card({ children, className, variant = 'default', ...viewProps }: CardProps): React.JSX.Element {
  return (
    <View className={cn('p-4', variantClasses[variant], className)} {...viewProps}>
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
  return <Text className={cn('text-lg font-semibold text-card-foreground', className)}>{children}</Text>;
}

export function CardDescription({ children, className }: CardTextProps): React.JSX.Element {
  return <Text className={cn('text-xs text-muted-foreground', className)}>{children}</Text>;
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
