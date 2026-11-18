import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
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

// DESIGN.md §4: primary = accent fill + onPrimary text; secondary / outline = transparent, 1px borderStrong,
// textSoft; ghost = text only; destructive = danger outline. Labels use the `label` variant (mono, uppercase).
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border border-primary bg-primary active:opacity-80',
  secondary: 'border border-border-strong bg-transparent active:bg-surface-hover',
  outline: 'border border-border-strong bg-transparent active:bg-surface-hover',
  ghost: 'bg-transparent active:bg-surface-hover',
  destructive: 'border border-destructive bg-transparent active:bg-surface-hover',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-text-soft',
  outline: 'text-text-soft',
  ghost: 'text-foreground',
  destructive: 'text-destructive',
};

// Every size keeps the 44 pt touch target (DESIGN.md §4).
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-11 px-3',
  md: 'h-11 px-5',
  lg: 'h-12 px-6',
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
      // The label is shown uppercase; the accessible name stays the label as written.
      accessibilityLabel={label}
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
        <ActivityIndicator color={variant === 'primary' ? theme.primaryForeground : theme.text} />
      ) : (
        <Text className={cn('text-xs font-medium uppercase tracking-label', variantTextClasses[variant], textClassName)}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
