import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Music } from 'lucide-react-native';

import { DEFAULT_MAP_REGION_DELTA } from '@/features/map/constants';
import { useTheme } from '@/hooks/use-theme';
import type { Coordinates } from '@/types/geo';
import { coordinatesToRegion } from '@/utils/geo';

type JamLocationMapProps = {
  coordinates: Coordinates;
  title: string;
  locationName: string;
};

export function JamLocationMap({
  coordinates,
  title,
  locationName,
}: JamLocationMapProps): React.JSX.Element {
  const theme = useTheme();

  if (Platform.OS === 'web') {
    return (
      <View
        className="h-44 items-center justify-center rounded-lg border border-border"
        style={{ backgroundColor: theme.backgroundElement }}>
        <Text className="px-4 text-center text-sm text-muted-foreground">
          Map preview is available on iOS and Android.
        </Text>
      </View>
    );
  }

  return (
    <View className="h-44 overflow-hidden rounded-lg border border-border">
      <MapView
        style={styles.map}
        initialRegion={coordinatesToRegion(coordinates, DEFAULT_MAP_REGION_DELTA)}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}>
        <Marker
          coordinate={coordinates}
          title={title}
          description={locationName}
          tracksViewChanges={false}>
          <View style={[styles.marker, { backgroundColor: theme.primary, borderColor: theme.background }]}>
            <Music size={14} color={theme.primaryForeground} strokeWidth={2.5} />
          </View>
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
