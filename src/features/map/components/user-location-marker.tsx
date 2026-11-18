import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Glow, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Coordinates } from '@/types/geo';

type UserLocationMarkerProps = {
  coordinates: Coordinates;
};

const PULSE_DURATION_MS = 2000;
const PULSE_MAX_SCALE = 3.2;

/**
 * DESIGN.md §4: the user's position as a cyan dot with a glow and a pulse — the only looping motion of the app,
 * off with reduce motion. Replaces the platform blue dot so the map keeps one colour language.
 */
export function UserLocationMarker({ coordinates }: UserLocationMarkerProps): React.JSX.Element {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    progress.value = withRepeat(withTiming(1, { duration: PULSE_DURATION_MS, easing: Easing.out(Easing.ease) }), -1);

    return () => {
      cancelAnimation(progress);
    };
  }, [progress, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - progress.value),
    transform: [{ scale: 1 + (PULSE_MAX_SCALE - 1) * progress.value }],
  }));

  return (
    // An animated marker has to keep tracking its view; with reduce motion it is a still dot.
    <Marker coordinate={coordinates} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={!reduceMotion} tappable={false}>
      <View collapsable={false} accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" style={styles.frame}>
        {reduceMotion ? null : <Animated.View style={[styles.dot, { backgroundColor: theme.accent }, pulseStyle]} />}
        <View style={[styles.dot, styles.core, { backgroundColor: theme.accent, borderColor: theme.background }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: Radius.full,
  },
  core: {
    borderWidth: 3,
    boxShadow: Glow.accent,
  },
});
