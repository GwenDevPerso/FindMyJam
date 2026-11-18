import { render, screen, userEvent } from '@testing-library/react-native';

import { MapExploreScreen } from '@/features/map/components/map-explore-screen';
import { DEFAULT_MAP_REGION_DELTA, DEFAULT_RADIUS_METERS } from '@/features/map/constants';
import { useJamSearchFilters } from '@/features/map/hooks/use-jam-search-filters';
import { useMapJams } from '@/features/map/hooks/use-map-jams';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { getAreaSearchRadius } from '@/features/map/utils/search-area';
import { useMapFiltersStore } from '@/store/map-filters.store';
import { coordinatesToRegion } from '@/utils/geo';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/features/map/hooks/use-user-location');
jest.mock('@/features/map/hooks/use-map-jams');
jest.mock('@/features/map/hooks/use-jam-search-filters');
jest.mock('@/features/map/components/map-filters', () => {
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    MapFilters: ({ showDistance }: { showDistance: boolean }) => (
      <MockText>{showDistance ? 'Distance filter shown' : 'Distance filter hidden'}</MockText>
    ),
  };
});

const MOCK_LYON_REGION = { latitude: 45.764, longitude: 4.8357, latitudeDelta: 0.08, longitudeDelta: 0.08 };
const MOCK_MARSEILLE = { id: 'marseille', label: 'Marseille, France', latitude: 43.2965, longitude: 5.3698 };

// The city search hits Nominatim: a stub lets the test pick a place directly.
jest.mock('@/features/location/components/location-autocomplete-input', () => {
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    LocationAutocompleteInput: ({
      value,
      proximity,
      onSelect,
    }: {
      value: string;
      proximity: { latitude: number };
      onSelect: (place: typeof MOCK_MARSEILLE) => void;
    }) => (
      <>
        <Text>City query: {value}</Text>
        <Text>Suggestions near {proximity.latitude}</Text>
        <Pressable onPress={() => onSelect(MOCK_MARSEILLE)}>
          <Text>Pick Marseille</Text>
        </Pressable>
      </>
    ),
  };
});

// The real map needs native modules: a stub lets the test pan the map, tap the recenter button and see where it flies.
jest.mock('@/features/map/components/jam-map', () => {
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    JamMap: ({
      initialRegion,
      focusedPlace,
      onRegionChangeComplete,
      onRecenter,
    }: {
      initialRegion: { latitude: number };
      focusedPlace: { latitude: number; longitude: number } | null;
      onRegionChangeComplete: (region: typeof MOCK_LYON_REGION) => void;
      onRecenter: () => void;
    }) => (
      <>
        <Text>Map opens at {initialRegion.latitude}</Text>
        {focusedPlace !== null ? <Text>Map focused on {focusedPlace.latitude}</Text> : null}
        <Pressable onPress={() => onRegionChangeComplete(MOCK_LYON_REGION)}>
          <Text>Pan to Lyon</Text>
        </Pressable>
        <Pressable onPress={onRecenter}>
          <Text>Recenter</Text>
        </Pressable>
      </>
    ),
  };
});

const mockedUseUserLocation = jest.mocked(useUserLocation);
const mockedUseMapJams = jest.mocked(useMapJams);
const mockedUseJamSearchFilters = jest.mocked(useJamSearchFilters);

const USER_LOCATION = { latitude: 48.8566, longitude: 2.3522, accuracy: 10 };

function lastSearchParams(): { latitude: number; longitude: number; radiusMeters: number } {
  return mockedUseMapJams.mock.lastCall![0].searchParams;
}

describe('MapExploreScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMapFiltersStore.setState(useMapFiltersStore.getInitialState(), true);
    mockedUseUserLocation.mockReturnValue({
      data: USER_LOCATION,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useUserLocation>);
    mockedUseJamSearchFilters.mockReturnValue({
      instrumentIds: [],
      styleIds: [],
      startsAfter: '2026-10-27T00:00:00.000Z',
      startsBefore: null,
    });
    mockedUseMapJams.mockReturnValue({
      markers: [],
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });
  });

  it('searches around the user location until the map moves', async () => {
    await render(<MapExploreScreen />);

    expect(screen.queryByRole('button', { name: 'Search this area' })).toBeNull();
    expect(screen.getByText('Distance filter shown')).toBeOnTheScreen();
    expect(lastSearchParams()).toMatchObject({
      latitude: USER_LOCATION.latitude,
      longitude: USER_LOCATION.longitude,
      radiusMeters: DEFAULT_RADIUS_METERS,
    });
  });

  it('offers to search the visible area once the map moved away, and searches there on tap', async () => {
    const user = userEvent.setup();
    await render(<MapExploreScreen />);

    await user.press(screen.getByText('Pan to Lyon'));
    await user.press(screen.getByRole('button', { name: 'Search this area' }));

    expect(lastSearchParams()).toMatchObject({
      latitude: MOCK_LYON_REGION.latitude,
      longitude: MOCK_LYON_REGION.longitude,
      radiusMeters: getAreaSearchRadius(MOCK_LYON_REGION),
    });
    expect(screen.queryByRole('button', { name: 'Search this area' })).toBeNull();
    expect(screen.getByText('Distance filter hidden')).toBeOnTheScreen();
  });

  it('flies to a picked city and searches the area the map shows there', async () => {
    const user = userEvent.setup();
    await render(<MapExploreScreen />);

    await user.press(screen.getByText('Pick Marseille'));

    expect(screen.getByText(`Map focused on ${MOCK_MARSEILLE.latitude}`)).toBeOnTheScreen();
    expect(screen.getByText('City query: Marseille, France')).toBeOnTheScreen();
    expect(lastSearchParams()).toMatchObject({
      latitude: MOCK_MARSEILLE.latitude,
      longitude: MOCK_MARSEILLE.longitude,
      radiusMeters: getAreaSearchRadius(coordinatesToRegion(MOCK_MARSEILLE, DEFAULT_MAP_REGION_DELTA)),
    });
    expect(screen.getByText('Distance filter hidden')).toBeOnTheScreen();
  });

  it('goes back to the user location and clears the city when recentering', async () => {
    const user = userEvent.setup();
    await render(<MapExploreScreen />);

    await user.press(screen.getByText('Pick Marseille'));
    await user.press(screen.getByText('Recenter'));

    expect(lastSearchParams()).toMatchObject({
      latitude: USER_LOCATION.latitude,
      longitude: USER_LOCATION.longitude,
      radiusMeters: DEFAULT_RADIUS_METERS,
    });
    expect(screen.getByText('City query:')).toBeOnTheScreen();
    expect(screen.queryByText(/Map focused on/)).toBeNull();
    expect(screen.getByText('Distance filter shown')).toBeOnTheScreen();
  });

  it('does not offer to search the old area while the map flies to a picked city', async () => {
    const user = userEvent.setup();
    await render(<MapExploreScreen />);

    await user.press(screen.getByText('Pan to Lyon'));
    expect(screen.getByRole('button', { name: 'Search this area' })).toBeOnTheScreen();
    await user.press(screen.getByText('Pick Marseille'));

    expect(screen.queryByRole('button', { name: 'Search this area' })).toBeNull();
  });

  it('ranks city suggestions near the searched area', async () => {
    const user = userEvent.setup();
    await render(<MapExploreScreen />);

    await user.press(screen.getByText('Pan to Lyon'));
    await user.press(screen.getByRole('button', { name: 'Search this area' }));

    expect(screen.getByText(`Suggestions near ${MOCK_LYON_REGION.latitude}`)).toBeOnTheScreen();
  });

  it('reopens the map on the searched area after an error and a retry', async () => {
    const user = userEvent.setup();
    await render(<MapExploreScreen />);

    await user.press(screen.getByText('Pan to Lyon'));
    await user.press(screen.getByRole('button', { name: 'Search this area' }));

    const okResult = mockedUseMapJams.mock.results.at(-1)!.value as ReturnType<typeof useMapJams>;
    mockedUseMapJams.mockReturnValue({ ...okResult, isError: true, error: new Error('Network down') });
    await screen.rerender(<MapExploreScreen />);
    expect(screen.getByText('Network down')).toBeOnTheScreen();

    mockedUseMapJams.mockReturnValue(okResult);
    await screen.rerender(<MapExploreScreen />);

    expect(screen.getByText(`Map opens at ${MOCK_LYON_REGION.latitude}`)).toBeOnTheScreen();
  });
});
