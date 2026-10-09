import AsyncStorage from '@react-native-async-storage/async-storage';

import { useMapFiltersStore } from '@/store/map-filters.store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const INSTRUMENT_ID = '11111111-1111-4111-8111-111111111111';
const STYLE_ID = '22222222-2222-4222-8222-222222222222';

function currentFilters(): Record<string, unknown> {
  const { radiusMeters, instrumentIds, styleIds, startsAfter, startsBefore } = useMapFiltersStore.getState();

  return { radiusMeters, instrumentIds, styleIds, startsAfter, startsBefore };
}

describe('useMapFiltersStore', () => {
  beforeEach(() => {
    useMapFiltersStore.setState(useMapFiltersStore.getInitialState(), true);
    jest.mocked(AsyncStorage.setItem).mockClear();
  });

  it('starts with a 25 km radius and no other filter', () => {
    expect(currentFilters()).toEqual({
      radiusMeters: 25_000,
      instrumentIds: [],
      styleIds: [],
      startsAfter: null,
      startsBefore: null,
    });
  });

  it('sets the radius', () => {
    useMapFiltersStore.getState().setRadiusMeters(5_000);

    expect(useMapFiltersStore.getState().radiusMeters).toBe(5_000);
  });

  it('replaces the selected instruments and styles independently', () => {
    useMapFiltersStore.getState().setInstrumentIds([INSTRUMENT_ID]);
    useMapFiltersStore.getState().setStyleIds([STYLE_ID]);

    expect(useMapFiltersStore.getState().instrumentIds).toEqual([INSTRUMENT_ID]);
    expect(useMapFiltersStore.getState().styleIds).toEqual([STYLE_ID]);
  });

  it('sets both ends of the date range', () => {
    useMapFiltersStore.getState().setDateRange('2026-07-21T00:00:00.000Z', null);

    expect(useMapFiltersStore.getState().startsAfter).toBe('2026-07-21T00:00:00.000Z');
    expect(useMapFiltersStore.getState().startsBefore).toBeNull();

    useMapFiltersStore.getState().setDateRange(null, '2026-07-28T00:00:00.000Z');

    expect(useMapFiltersStore.getState().startsAfter).toBeNull();
    expect(useMapFiltersStore.getState().startsBefore).toBe('2026-07-28T00:00:00.000Z');
  });

  it('resets every filter to its default', () => {
    const state = useMapFiltersStore.getState();
    state.setRadiusMeters(50_000);
    state.setInstrumentIds([INSTRUMENT_ID]);
    state.setStyleIds([STYLE_ID]);
    state.setDateRange('2026-07-21T00:00:00.000Z', '2026-07-28T00:00:00.000Z');

    useMapFiltersStore.getState().resetFilters();

    expect(currentFilters()).toEqual({
      radiusMeters: 25_000,
      instrumentIds: [],
      styleIds: [],
      startsAfter: null,
      startsBefore: null,
    });
  });

  it('persists the filters under the "map-filters" key', () => {
    useMapFiltersStore.getState().setRadiusMeters(10_000);

    const [key, value] = jest.mocked(AsyncStorage.setItem).mock.calls[0];

    expect(key).toBe('map-filters');
    expect(JSON.parse(value).state).toMatchObject({ radiusMeters: 10_000, instrumentIds: [] });
  });
});
