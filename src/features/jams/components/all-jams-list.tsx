import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { type Href, router } from 'expo-router';

import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { AnimatedListItem } from '@/components/ui/animated-list-item';
import { JamCard } from '@/features/jams/components/jam-card';
import {
  ALL_JAMS_PAGE_SIZE,
  useInfiniteJams,
} from '@/features/jams/hooks/use-infinite-jams';
import { LocationAutocompleteInput } from '@/features/location/components/location-autocomplete-input';
import type { PlaceSuggestion } from '@/features/location/types';
import { DEFAULT_RADIUS_METERS, FALLBACK_USER_LOCATION } from '@/features/map/constants';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { useTheme } from '@/hooks/use-theme';
import type { Jam } from '@/types/domain';
import type { Coordinates } from '@/types/geo';

type SelectedCity = {
  label: string;
  latitude: number;
  longitude: number;
};

function getErrorMessage(error: Error): string {
  if (error.message.length > 0) {
    return error.message;
  }

  return 'Something went wrong while loading jams.';
}

export function AllJamsList(): React.JSX.Element {
  const theme = useTheme();
  const [cityQuery, setCityQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);

  const locationQuery = useUserLocation({ enabled: selectedCity === null });

  const searchCenter = useMemo((): Coordinates => {
    if (selectedCity !== null) {
      return {
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
      };
    }

    return {
      latitude: locationQuery.data?.latitude ?? FALLBACK_USER_LOCATION.latitude,
      longitude: locationQuery.data?.longitude ?? FALLBACK_USER_LOCATION.longitude,
    };
  }, [selectedCity, locationQuery.data]);

  const proximity = useMemo((): Coordinates => {
    if (locationQuery.data === undefined || locationQuery.data === null) {
      return FALLBACK_USER_LOCATION;
    }

    return {
      latitude: locationQuery.data.latitude,
      longitude: locationQuery.data.longitude,
    };
  }, [locationQuery.data]);

  const filters = useMemo(
    () => ({
      latitude: searchCenter.latitude,
      longitude: searchCenter.longitude,
      radiusMeters: DEFAULT_RADIUS_METERS,
      limit: ALL_JAMS_PAGE_SIZE,
    }),
    [searchCenter],
  );

  const jamsQuery = useInfiniteJams({
    filters,
    enabled: true,
  });

  const handleCityChange = (text: string): void => {
    setCityQuery(text);

    if (selectedCity !== null && text !== selectedCity.label) {
      setSelectedCity(null);
    }
  };

  const handleCitySelect = (place: PlaceSuggestion): void => {
    setCityQuery(place.label);
    setSelectedCity({
      label: place.label,
      latitude: place.latitude,
      longitude: place.longitude,
    });
  };

  const handleJamPress = (jamId: string): void => {
    router.push(`/jams/${jamId}` as Href);
  };

  const handleEndReached = (): void => {
    if (!jamsQuery.hasNextPage || jamsQuery.isFetchingNextPage) {
      return;
    }

    jamsQuery.fetchNextPage();
  };

  const renderItem: ListRenderItem<Jam> = ({ item, index }) => (
    <AnimatedListItem index={index}>
      <JamCard jam={item} onPress={handleJamPress} />
    </AnimatedListItem>
  );

  return (
    <View className="flex-1">
      <View className="z-10 mb-3 gap-2">
        <LocationAutocompleteInput
          value={cityQuery}
          onChangeText={handleCityChange}
          onSelect={handleCitySelect}
          proximity={proximity}
          label="Search by city"
          placeholder="Paris, Lyon, Marseille…"
        />
        <Text className="text-sm text-muted-foreground">
          {selectedCity !== null
            ? `Jams near ${selectedCity.label}`
            : 'Showing jams near your location — pick a city to refine.'}
        </Text>
      </View>

      {jamsQuery.isLoading ? (
        <Loading message="Loading jams…" size="large" fullScreen={false} className="py-12" />
      ) : null}

      {jamsQuery.isError ? (
        <ErrorState
          title="Unable to load jams"
          message={getErrorMessage(jamsQuery.error ?? new Error('Unknown error'))}
          onRetry={() => {
            jamsQuery.refetch();
          }}
        />
      ) : null}

      {!jamsQuery.isLoading && !jamsQuery.isError ? (
        <FlatList
          data={jamsQuery.jams}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              title="No jams found"
              description={
                selectedCity !== null
                  ? 'No upcoming jams in this city. Try another place or create one.'
                  : 'No upcoming jams near you. Search a city or create a jam.'
              }
            />
          }
          ListFooterComponent={
            jamsQuery.isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshing={jamsQuery.isRefetching && !jamsQuery.isFetchingNextPage}
          onRefresh={() => {
            jamsQuery.refetch();
          }}
          removeClippedSubviews={true}
          windowSize={7}
          maxToRenderPerBatch={10}
          initialNumToRender={8}
          contentContainerClassName="pb-4 grow"
          keyboardShouldPersistTaps="handled"
        />
      ) : null}
    </View>
  );
}
