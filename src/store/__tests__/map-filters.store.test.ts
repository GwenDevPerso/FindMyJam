import AsyncStorage from '@react-native-async-storage/async-storage';

import { useMapFiltersStore } from '@/store/map-filters.store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const INSTRUMENT_ID = '11111111-1111-4111-8111-111111111111';
const STYLE_ID = '22222222-2222-4222-8222-222222222222';

function currentFilters(): Record<string, unknown> {
  const { radiusMeters, instrumentIds, styleIds, dateFilter } = useMapFiltersStore.getState();

  return { radiusMeters, instrumentIds, styleIds, dateFilter };
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
      dateFilter: 'any',
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

  it('toggles an instrument and a style in and out of the selection', () => {
    useMapFiltersStore.getState().toggleInstrumentId(INSTRUMENT_ID);
    useMapFiltersStore.getState().toggleStyleId(STYLE_ID);

    expect(useMapFiltersStore.getState().instrumentIds).toEqual([INSTRUMENT_ID]);
    expect(useMapFiltersStore.getState().styleIds).toEqual([STYLE_ID]);

    useMapFiltersStore.getState().toggleInstrumentId(INSTRUMENT_ID);
    useMapFiltersStore.getState().toggleStyleId(STYLE_ID);

    expect(useMapFiltersStore.getState().instrumentIds).toEqual([]);
    expect(useMapFiltersStore.getState().styleIds).toEqual([]);
  });

  it('sets the date filter', () => {
    useMapFiltersStore.getState().setDateFilter('weekend');

    expect(useMapFiltersStore.getState().dateFilter).toBe('weekend');
  });

  it('resets every filter to its default', () => {
    const state = useMapFiltersStore.getState();
    state.setRadiusMeters(50_000);
    state.setInstrumentIds([INSTRUMENT_ID]);
    state.setStyleIds([STYLE_ID]);
    state.setDateFilter('today');

    useMapFiltersStore.getState().resetFilters();

    expect(currentFilters()).toEqual({
      radiusMeters: 25_000,
      instrumentIds: [],
      styleIds: [],
      dateFilter: 'any',
    });
  });

  it('persists the filters under the "map-filters" key', () => {
    useMapFiltersStore.getState().setRadiusMeters(10_000);

    const [key, value] = jest.mocked(AsyncStorage.setItem).mock.calls[0];

    expect(key).toBe('map-filters');
    expect(JSON.parse(value).state).toMatchObject({ radiusMeters: 10_000, instrumentIds: [] });
  });

  it('drops the absolute date range persisted by the previous version', () => {
    const migrate = useMapFiltersStore.persist.getOptions().migrate;

    const migrated = migrate?.(
      {
        radiusMeters: 10_000,
        instrumentIds: [INSTRUMENT_ID],
        styleIds: [],
        startsAfter: '2026-07-21T00:00:00.000Z',
        startsBefore: null,
      },
      0,
    );

    expect(migrated).toEqual({ radiusMeters: 10_000, instrumentIds: [INSTRUMENT_ID], styleIds: [], dateFilter: 'any' });
  });
});
