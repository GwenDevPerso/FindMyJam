import { View } from 'react-native';

import { cn } from '@/utils/cn';

export type SkeletonVariant = 'line' | 'block';

type SkeletonProps = {
  variant: SkeletonVariant;
  className?: string;
};

// DESIGN.md §5: loading placeholder in `surfaceHover`; a line of text or a block (card, image).
const variantClasses: Record<SkeletonVariant, string> = {
  line: 'h-3 w-full rounded-sm',
  block: 'h-24 w-full rounded-xl',
};

export function Skeleton({ variant, className }: SkeletonProps): React.JSX.Element {
  return (
    <View
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
      className={cn('bg-surface-hover', variantClasses[variant], className)}
    />
  );
}
