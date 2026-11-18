import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Music } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { useMarkerTracksViewChanges } from '@/features/map/hooks/use-marker-tracks-view-changes';
import { DEFAULT_MAP_REGION_DELTA, MAP_PREVIEW_HEIGHT } from '@/features/map/constants';
import { useTheme } from '@/hooks/use-theme';
import type { Coordinates } from '@/types/geo';
import { coordinatesToRegion } from '@/utils/geo';

type JamLocationMapProps = {
  coordinates: Coordinates;
  title: string;
  locationName: string;
};

function buildCoordinateKey(coordinates: Coordinates): string {
  return `${coordinates.latitude.toFixed(6)},${coordinates.longitude.toFixed(6)}`;
}

export function JamLocationMap({
  coordinates,
  title,
  locationName,
}: JamLocationMapProps): React.JSX.Element {
  const theme = useTheme();
  const coordinateKey = buildCoordinateKey(coordinates);
  const tracksViewChanges = useMarkerTracksViewChanges(coordinateKey);

  if (Platform.OS === 'web') {
    return (
      <View
        className="items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary"
        style={styles.mapContainer}>
        <Text className="px-4 text-center text-sm text-muted-foreground">
          Map preview is available on iOS and Android.
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-xl border border-border" style={styles.mapContainer}>
      <MapView
        style={styles.map}
        initialRegion={coordinatesToRegion(coordinates, DEFAULT_MAP_REGION_DELTA)}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}>
        <Marker
          key={coordinateKey}
          coordinate={coordinates}
          title={title}
          description={locationName}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={tracksViewChanges}>
          <View
            collapsable={false}
            style={[styles.marker, { backgroundColor: theme.primary, borderColor: theme.background }]}>
            <Music size={14} color={theme.primaryForeground} strokeWidth={2.5} />
          </View>
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: MAP_PREVIEW_HEIGHT,
    width: '100%',
  },
  map: {
    width: '100%',
    height: MAP_PREVIEW_HEIGHT,
  },
  marker: {
    width: 32,
    height: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
