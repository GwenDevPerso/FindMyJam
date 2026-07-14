import { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type MapMarkerProps, type Region } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';

import { DEFAULT_MAP_REGION_DELTA } from '@/features/map/constants';
import { useTheme } from '@/hooks/use-theme';
import { geocodingService } from '@/services/geocoding.service';
import type { Coordinates } from '@/types/geo';
import { coordinatesToRegion } from '@/utils/geo';

type LocationPickerMapProps = {
  coordinates: Coordinates;
  onCoordinatesChange: (coordinates: Coordinates) => void;
  onLocationNameChange: (locationName: string) => void;
};

export function LocationPickerMap({
  coordinates,
  onCoordinatesChange,
  onLocationNameChange,
}: LocationPickerMapProps): React.JSX.Element {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const reverseGeocodeRequestIdRef = useRef<number>(0);

  const animateToCoordinates = useCallback((nextCoordinates: Coordinates): void => {
    mapRef.current?.animateToRegion(
      coordinatesToRegion(nextCoordinates, DEFAULT_MAP_REGION_DELTA),
      300,
    );
  }, []);

  useEffect(() => {
    animateToCoordinates(coordinates);
  }, [animateToCoordinates, coordinates.latitude, coordinates.longitude]);

  const handleDragEnd: MapMarkerProps['onDragEnd'] = (event) => {
    const nextCoordinates: Coordinates = {
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
    };

    onCoordinatesChange(nextCoordinates);

    const requestId = reverseGeocodeRequestIdRef.current + 1;
    reverseGeocodeRequestIdRef.current = requestId;

    void geocodingService
      .reverseGeocode(nextCoordinates)
      .then((locationName) => {
        if (reverseGeocodeRequestIdRef.current === requestId) {
          onLocationNameChange(locationName);
        }
      })
      .catch(() => {
        // Keep the existing location name if reverse geocoding fails.
      });
  };

  if (Platform.OS === 'web') {
    return (
      <View
        className="h-48 items-center justify-center rounded-lg border border-border bg-secondary"
        style={{ backgroundColor: theme.backgroundElement }}>
        <Text className="px-4 text-center text-sm text-muted-foreground">
          Map preview is available on iOS and Android.
        </Text>
      </View>
    );
  }

  const initialRegion: Region = coordinatesToRegion(coordinates, DEFAULT_MAP_REGION_DELTA);

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">Map preview</Text>
      <Text className="text-xs text-muted-foreground">Drag the pin to adjust the exact location.</Text>

      <View className="h-48 overflow-hidden rounded-lg border border-border">
        <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion} toolbarEnabled={false}>
          <Marker
            coordinate={coordinates}
            draggable
            onDragEnd={handleDragEnd}
            tracksViewChanges={false}>
            <View style={[styles.marker, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <MapPin size={16} color={theme.primaryForeground} strokeWidth={2.5} />
            </View>
          </Marker>
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
