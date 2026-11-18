import { type Href, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { Text } from '@/components/ui/text';
import { Routes } from '@/constants/routes';
import { LocationAutocompleteInput } from '@/features/location/components/location-autocomplete-input';
import type { PlaceSuggestion } from '@/features/location/types';
import { JamMap } from '@/features/map/components/jam-map';
import { MapFilters } from '@/features/map/components/map-filters';
import { DEFAULT_MAP_REGION_DELTA, FALLBACK_USER_LOCATION } from '@/features/map/constants';
import { useJamSearchFilters } from '@/features/map/hooks/use-jam-search-filters';
import { useMapJams } from '@/features/map/hooks/use-map-jams';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import type { MapSearchParams } from '@/features/map/types';
import { getAreaSearchRadius, isOutsideSearchArea, type SearchArea } from '@/features/map/utils/search-area';
import { useMapFiltersStore } from '@/store/map-filters.store';
import type { Coordinates, MapRegion } from '@/types/geo';
import { coordinatesToRegion } from '@/utils/geo';

export function MapExploreScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  // The filters float under the status bar: the only value computed at runtime.
  const overlayStyle = useMemo(() => ({ top: insets.top + 8 }), [insets.top]);
  const radiusMeters = useMapFiltersStore((state) => state.radiusMeters);
  const { instrumentIds, styleIds, startsAfter, startsBefore } = useJamSearchFilters();

  const {
    data: userLocation,
    isLoading: isLocationLoading,
    refetch: refetchLocation,
  } = useUserLocation({ enabled: Platform.OS !== 'web' });

  const resolvedLocation = userLocation ?? FALLBACK_USER_LOCATION;
  const isUsingFallbackLocation = userLocation === null;

  // The visible region changes on every pan: kept in a ref so panning does not re-render the screen and its markers.
  // null until the map reports a region, and again while it flies to a picked city or back to the user.
  const visibleRegionRef = useRef<MapRegion | null>(null);
  const [canSearchVisibleArea, setCanSearchVisibleArea] = useState(false);
  // null searches around the user, with the radius picked in the filters.
  const [searchArea, setSearchArea] = useState<SearchArea | null>(null);
  const searchCenter = searchArea?.center ?? resolvedLocation;
  const searchedRadius = searchArea?.radiusMeters ?? radiusMeters;
  const [cityQuery, setCityQuery] = useState('');
  const [focusedPlace, setFocusedPlace] = useState<Coordinates | null>(null);

  const searchParams = useMemo((): MapSearchParams => {
    return {
      latitude: searchCenter.latitude,
      longitude: searchCenter.longitude,
      radiusMeters: searchedRadius,
      instrumentIds,
      styleIds,
      startsAfter,
      startsBefore,
    };
  }, [searchCenter, searchedRadius, instrumentIds, styleIds, startsAfter, startsBefore]);

  // The search changed (area searched, city picked, recentered, distance filter): compare it with the visible map again.
  useEffect(() => {
    const region = visibleRegionRef.current;
    setCanSearchVisibleArea(
      region !== null && isOutsideSearchArea({ center: searchCenter, radiusMeters: searchedRadius }, region),
    );
  }, [searchCenter, searchedRadius]);

  const handleRegionChangeComplete = useCallback(
    (region: MapRegion): void => {
      visibleRegionRef.current = region;
      setCanSearchVisibleArea(isOutsideSearchArea({ center: searchCenter, radiusMeters: searchedRadius }, region));
    },
    [searchCenter, searchedRadius],
  );

  // A remount (after an error) reopens the map on the searched area, not on the user.
  const initialRegion = useMemo(
    (): MapRegion => coordinatesToRegion(searchCenter, DEFAULT_MAP_REGION_DELTA),
    [searchCenter],
  );

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

  const handleSearchVisibleArea = useCallback((): void => {
    const region = visibleRegionRef.current;

    if (region === null) {
      return;
    }

    setSearchArea({
      center: { latitude: region.latitude, longitude: region.longitude },
      radiusMeters: getAreaSearchRadius(region),
    });
    // The map no longer shows the picked city.
    setCityQuery('');
  }, []);

  const handleCitySelect = useCallback((place: PlaceSuggestion): void => {
    const center = { latitude: place.latitude, longitude: place.longitude };

    setCityQuery(place.label);
    setFocusedPlace(center);
    // The map is about to fly away: the region it reports next is the one to compare with.
    visibleRegionRef.current = null;
    // Search the area the map is about to show around the city.
    setSearchArea({
      center,
      radiusMeters: getAreaSearchRadius(coordinatesToRegion(center, DEFAULT_MAP_REGION_DELTA)),
    });
  }, []);

  const handleRecenter = useCallback((): void => {
    visibleRegionRef.current = null;
    setSearchArea(null);
    setFocusedPlace(null);
    setCityQuery('');
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
        initialRegion={initialRegion}
        userLocation={resolvedLocation}
        searchCircle={{ center: searchCenter, radiusMeters: searchedRadius }}
        focusedPlace={focusedPlace}
        selectedMarkerId={null}
        onMarkerPress={handleMarkerPress}
        onRegionChangeComplete={handleRegionChangeComplete}
        onRecenter={handleRecenter}
      />

      <View
        className="absolute left-0 right-0 gap-2 px-4"
        style={overlayStyle}>
        <LocationAutocompleteInput
          value={cityQuery}
          onChangeText={setCityQuery}
          onSelect={handleCitySelect}
          proximity={searchCenter}
          placeholder="Search a city…"
        />
        {/* The visible-area search takes its radius from the zoom, so the distance choice only applies around the user. */}
        <MapFilters showDistance={searchArea === null} />

        <View className="self-start rounded-full border border-border-strong bg-card/95 px-3 py-1.5">
          <Text className="font-mono text-xs font-semibold uppercase tracking-label text-text-soft">
            {markers.length} jam{markers.length === 1 ? '' : 's'}
            {isFetchingNextPage ? ' · loading…' : ''}
          </Text>
        </View>

        {isUsingFallbackLocation && searchArea === null ? (
          <View className="self-start rounded-lg bg-muted px-3 py-2">
            <Text className="text-sm text-text-soft">
              Location unavailable — showing jams near Paris. Enable location for nearby results.
            </Text>
          </View>
        ) : null}
      </View>

      {canSearchVisibleArea ? (
        <View pointerEvents="box-none" className="absolute bottom-8 left-0 right-0 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search this area"
            onPress={handleSearchVisibleArea}
            className="min-h-11 justify-center rounded-full border border-accent bg-background/90 px-4 active:bg-surface-hover">
            <Text className="text-base font-bold text-accent">Search this area</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
