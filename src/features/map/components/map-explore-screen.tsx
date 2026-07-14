import { type Href, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { Routes } from '@/constants/routes';
import { JamMap } from '@/features/map/components/jam-map';
import { MapFilters } from '@/features/map/components/map-filters';
import { FALLBACK_USER_LOCATION } from '@/features/map/constants';
import { useMapJams } from '@/features/map/hooks/use-map-jams';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import type { MapSearchParams } from '@/features/map/types';
import { useMapFiltersStore } from '@/store/map-filters.store';

export function MapExploreScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [sessionStartsAfter] = useState((): string => new Date().toISOString());

  const radiusMeters = useMapFiltersStore((state) => state.radiusMeters);
  const instrumentIds = useMapFiltersStore((state) => state.instrumentIds);
  const styleIds = useMapFiltersStore((state) => state.styleIds);
  const startsAfter = useMapFiltersStore((state) => state.startsAfter);
  const startsBefore = useMapFiltersStore((state) => state.startsBefore);

  const {
    data: userLocation,
    isLoading: isLocationLoading,
    refetch: refetchLocation,
  } = useUserLocation({ enabled: Platform.OS !== 'web' });

  const resolvedLocation = userLocation ?? FALLBACK_USER_LOCATION;
  const isUsingFallbackLocation = userLocation === null;

  const searchParams = useMemo((): MapSearchParams => {
    return {
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
      radiusMeters,
      instrumentIds,
      styleIds,
      startsAfter: startsAfter ?? sessionStartsAfter,
      startsBefore,
    };
  }, [resolvedLocation, radiusMeters, instrumentIds, styleIds, startsAfter, startsBefore, sessionStartsAfter]);

  const {
    markers,
    isLoading: isJamsLoading,
    isFetchingNextPage,
    isError: isJamsError,
    error: jamsError,
    hasNextPage,
    fetchNextPage,
    refetch: refetchJams,
  } = useMapJams({
    searchParams,
    enabled: Platform.OS !== 'web' && !isLocationLoading,
  });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isJamsLoading) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isJamsLoading]);

  const handleMarkerPress = useCallback((markerId: string): void => {
    router.push(Routes.jamDetail(markerId) as Href);
  }, []);

  const handleRetry = useCallback((): void => {
    refetchJams();
    refetchLocation();
  }, [refetchJams, refetchLocation]);

  if (Platform.OS === 'web') {
    return (
      <EmptyState
        title="Map unavailable on web"
        description="Open FindMyJam on iOS or Android to explore jams on the map."
      />
    );
  }

  if (isLocationLoading || isJamsLoading) {
    return <Loading message="Loading map…" size="large" fullScreen />;
  }

  if (isJamsError) {
    const message =
      jamsError instanceof Error ? jamsError.message : 'Unable to load jams for the map.';

    return (
      <ErrorState
        title="Could not load jams"
        message={message}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <JamMap
        markers={markers}
        userLocation={resolvedLocation}
        selectedMarkerId={null}
        onMarkerPress={handleMarkerPress}
      />

      <View
        className="absolute left-0 right-0 gap-2 px-4"
        style={{ top: insets.top + 8 }}>
        <MapFilters />

        <View className="self-start rounded-full bg-card/95 px-3 py-1.5">
          <Text className="text-xs font-medium text-foreground">
            {markers.length} jam{markers.length === 1 ? '' : 's'}
            {isFetchingNextPage ? ' · loading…' : ''}
          </Text>
        </View>

        {isUsingFallbackLocation ? (
          <View className="self-start rounded-lg bg-muted px-3 py-2">
            <Text className="text-xs text-muted-foreground">
              Location unavailable — showing jams near Paris. Enable location for nearby results.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
