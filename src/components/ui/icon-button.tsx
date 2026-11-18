import { Pressable, type PressableProps } from 'react-native';

import { cn } from '@/utils/cn';

export type IconButtonVariant = 'default' | 'overlay';

type IconButtonProps = PressableProps & {
  accessibilityLabel: string;
  variant: IconButtonVariant;
  className?: string;
};

// DESIGN.md §4: 44 × 44, 1px borderStrong; on `surface`, or on 80 % `background` over the horizon.
const variantClasses: Record<IconButtonVariant, string> = {
  default: 'bg-card active:bg-surface-hover',
  overlay: 'bg-background/80 active:bg-background',
};

export function IconButton({ variant, className, children, ...pressableProps }: IconButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'h-11 w-11 items-center justify-center rounded-md border border-border-strong',
        variantClasses[variant],
        className,
      )}
      {...pressableProps}>
      {children}
    </Pressable>
  );
}
