import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Glow } from '@/constants/theme';
import { cn } from '@/utils/cn';

type CountBadgeProps = {
  count: number;
  accessibilityLabel: string;
  className?: string;
};

/** DESIGN.md §5: a pink pill with glow showing a count (unread notifications); nothing when the count is 0. */
export function CountBadge({ count, accessibilityLabel, className }: CountBadgeProps): React.JSX.Element | null {
  if (count <= 0) {
    return null;
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className={cn('min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1', className)}
      style={styles.glow}>
      <Text className="font-mono text-xs font-semibold text-primary-foreground">{count > 99 ? '99+' : String(count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { boxShadow: Glow.primary },
});
