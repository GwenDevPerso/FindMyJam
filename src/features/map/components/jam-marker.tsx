import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, type MapMarkerProps } from 'react-native-maps';
import { Music } from 'lucide-react-native';

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

  // DESIGN.md §1: one accent — the selected jam is the accent, the others are ink (text colour).
  const markerColor = isSelected ? theme.primary : theme.text;
  const iconColor = isSelected ? theme.primaryForeground : theme.background;

  return (
    <Marker
      identifier={marker.id}
      coordinate={{
        latitude: marker.latitude,
        longitude: marker.longitude,
      }}
      title={marker.title}
      description={marker.locationName}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={handlePress}
      tracksViewChanges={tracksViewChanges}>
      <View
        collapsable={false}
        style={[styles.marker, { backgroundColor: markerColor, borderColor: theme.background }]}>
        <Music size={14} color={iconColor} strokeWidth={2.5} />
      </View>
    </Marker>
  );
}

export const JamMarker = memo(JamMarkerComponent);

const styles = StyleSheet.create({
  marker: {
    width: 32,
    height: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
