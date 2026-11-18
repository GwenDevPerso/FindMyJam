import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { Glow } from '@/constants/theme';
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

// DESIGN.md §4: primary = pink fill, onPrimary text, glow; secondary / outline = 1px cyan, cyan text; ghost = quiet
// (1px borderStrong, textSoft); destructive = 1px danger, danger text. Labels use the `button` style.
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:opacity-80',
  secondary: 'border border-accent bg-transparent active:bg-surface-hover',
  outline: 'border border-accent bg-transparent active:bg-surface-hover',
  ghost: 'border border-border-strong bg-transparent active:bg-surface-hover',
  destructive: 'border border-destructive bg-transparent active:bg-surface-hover',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-accent',
  outline: 'text-accent',
  ghost: 'text-text-soft',
  destructive: 'text-destructive',
};

// Heights 44 / 48 / 56 (DESIGN.md §4: secondary 48, primary 56); every size keeps the 44 pt touch target.
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-11 px-4',
  md: 'h-12 px-5',
  lg: 'h-14 px-6',
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
        'flex-row items-center justify-center rounded-lg',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && 'opacity-50',
        className,
      )}
      style={variant === 'primary' && !isDisabled ? styles.glow : undefined}
      {...pressableProps}>
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.primaryForeground : theme.text} />
      ) : (
        <Text className={cn('text-base font-bold uppercase tracking-button', variantTextClasses[variant], textClassName)}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glow: { boxShadow: Glow.primary },
});
