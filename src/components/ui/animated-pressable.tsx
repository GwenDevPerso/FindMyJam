import { type ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableScaleProps = PressableProps & {
  children: ReactNode;
  scaleValue: number;
  className?: string;
};

export function AnimatedPressableScale({
  children,
  scaleValue,
  className,
  onPressIn,
  onPressOut,
  ...pressableProps
}: AnimatedPressableScaleProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event: Parameters<NonNullable<PressableProps['onPressIn']>>[0]): void => {
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
    onPressIn?.(event);
  };

  const handlePressOut = (event: Parameters<NonNullable<PressableProps['onPressOut']>>[0]): void => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      className={className}
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...pressableProps}>
      {children}
    </AnimatedPressable>
  );
}
