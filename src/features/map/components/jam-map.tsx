import { useCallback, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { LocateFixed } from 'lucide-react-native';

import { JamMarker } from '@/features/map/components/jam-marker';
import { DEFAULT_MAP_REGION_DELTA } from '@/features/map/constants';
import type { MapJamMarker } from '@/features/map/types';
import { shouldEnableClustering } from '@/features/map/utils/marker-clustering';
import { useTheme } from '@/hooks/use-theme';
import type { Coordinates } from '@/types/geo';
import { coordinatesToRegion } from '@/utils/geo';

type JamMapProps = {
  markers: MapJamMarker[];
  userLocation: Coordinates;
  selectedMarkerId: string | null;
  onMarkerPress: (markerId: string) => void;
};

export function JamMap({
  markers,
  userLocation,
  selectedMarkerId,
  onMarkerPress,
}: JamMapProps): React.JSX.Element {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);

  const initialRegion = useMemo(
    (): Region => coordinatesToRegion(userLocation, DEFAULT_MAP_REGION_DELTA),
    [userLocation],
  );

  const renderableMarkers = useMemo((): MapJamMarker[] => {
    if (shouldEnableClustering(markers.length)) {
      // Future: swap individual markers for cluster markers via supercluster.
    }

    return markers;
  }, [markers]);

  const handleRecenter = useCallback((): void => {
    mapRef.current?.animateToRegion(coordinatesToRegion(userLocation, DEFAULT_MAP_REGION_DELTA), 400);
  }, [userLocation]);

  if (Platform.OS === 'web') {
    return <View style={[styles.map, { backgroundColor: theme.backgroundElement }]} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}>
        {renderableMarkers.map((marker) => (
          <JamMarker
            key={marker.id}
            marker={marker}
            isSelected={selectedMarkerId === marker.id}
            onPress={onMarkerPress}
          />
        ))}
      </MapView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Center map on my location"
        onPress={handleRecenter}
        style={[
          styles.recenterButton,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}>
        <LocateFixed size={20} color={theme.primary} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
