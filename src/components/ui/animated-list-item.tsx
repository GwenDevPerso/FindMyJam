import { type ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

type AnimatedListItemProps = {
  children: ReactNode;
  index: number;
  className?: string;
};

const STAGGER_DELAY_MS = 60;
const MAX_STAGGER_INDEX = 8;

export function AnimatedListItem({
  children,
  index,
  className,
}: AnimatedListItemProps): React.JSX.Element {
  const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_DELAY_MS;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(350).springify().damping(18)}
      className={className}>
      {children}
    </Animated.View>
  );
}
