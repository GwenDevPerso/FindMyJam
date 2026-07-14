import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PressableProps & {
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  isLoading: boolean;
  className?: string;
  textClassName?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:opacity-90',
  secondary: 'bg-secondary active:opacity-90',
  outline: 'border border-border bg-transparent active:bg-secondary',
  ghost: 'bg-transparent active:bg-secondary',
  destructive: 'bg-destructive active:opacity-90',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  destructive: 'text-destructive-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 rounded-full',
  md: 'h-11 px-5 rounded-full',
  lg: 'h-12 px-6 rounded-full',
};

const sizeTextClasses: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base',
};

export function Button({
  label,
  variant,
  size,
  isLoading,
  disabled,
  className,
  textClassName,
  ...pressableProps
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const isDisabled = disabled === true || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && 'opacity-50',
        className,
      )}
      {...pressableProps}>
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'destructive' ? theme.primaryForeground : theme.text}
        />
      ) : (
        <Text className={cn('font-semibold', variantTextClasses[variant], sizeTextClasses[size], textClassName)}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
