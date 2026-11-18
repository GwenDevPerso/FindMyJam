import { Music } from 'lucide-react-native';
import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, type MapMarkerProps } from 'react-native-maps';

import { Glow, Spacing } from '@/constants/theme';
import { useMarkerTracksViewChanges } from '@/features/map/hooks/use-marker-tracks-view-changes';
import type { MapJamMarker } from '@/features/map/types';
import { useTheme } from '@/hooks/use-theme';

type JamMarkerProps = {
  marker: MapJamMarker;
  isSelected: boolean;
  onPress: (markerId: string) => void;
};

function JamMarkerComponent({ marker, isSelected, onPress }: JamMarkerProps): React.JSX.Element {
  const theme = useTheme();
  const coordinateKey = `${marker.id}:${marker.latitude}:${marker.longitude}:${isSelected}`;
  const tracksViewChanges = useMarkerTracksViewChanges(coordinateKey);

  const handlePress: MapMarkerProps['onPress'] = useCallback(() => {
    onPress(marker.id);
  }, [marker.id, onPress]);

  // DESIGN.md §4: pink pins — outline on `surface`, the selected one filled pink, larger and glowing.
  const pinColors = isSelected
    ? { backgroundColor: theme.primary, borderColor: theme.primary }
    : { backgroundColor: theme.surface, borderColor: theme.primary };

  return (
    <Marker
      identifier={marker.id}
      coordinate={{
        latitude: marker.latitude,
        longitude: marker.longitude,
      }}
      title={marker.title}
      description={marker.locationName}
      anchor={{ x: 0.5, y: 1 }}
      onPress={handlePress}
      tracksViewChanges={tracksViewChanges}>
      <View collapsable={false} style={[styles.pin, isSelected ? styles.pinSelected : null, pinColors]}>
        <View style={styles.icon}>
          <Music size={isSelected ? 18 : 15} color={isSelected ? theme.primaryForeground : theme.primary} strokeWidth={2} />
        </View>
      </View>
    </Marker>
  );
}

export const JamMarker = memo(JamMarkerComponent);

// A teardrop: three round corners and a sharp one, turned so the point faces down.
const styles = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    margin: Spacing.three,
    borderWidth: 2,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSelected: {
    width: 44,
    height: 44,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    boxShadow: Glow.primary,
  },
  icon: {
    transform: [{ rotate: '45deg' }],
  },
});
