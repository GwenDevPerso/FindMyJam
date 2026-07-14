import { Text, View, type ViewProps } from 'react-native';

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

const variantClasses: Record<CardVariant, string> = {
  default: 'rounded-xl border border-border bg-card',
  elevated: 'rounded-xl border border-border/50 bg-card-elevated',
  interactive: 'rounded-xl border border-border/50 bg-card-elevated',
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
  return <Text className={cn('text-lg font-bold text-card-foreground', className)}>{children}</Text>;
}

export function CardDescription({ children, className }: CardTextProps): React.JSX.Element {
  return <Text className={cn('text-sm text-muted-foreground', className)}>{children}</Text>;
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
