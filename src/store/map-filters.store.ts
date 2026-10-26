import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_RADIUS_METERS,
  type DateFilterOption,
  type DistanceFilterOption,
} from '@/features/map/constants';

type MapFilters = {
  radiusMeters: DistanceFilterOption;
  instrumentIds: string[];
  styleIds: string[];
  dateFilter: DateFilterOption;
};

type MapFiltersState = MapFilters & {
  setRadiusMeters: (radiusMeters: DistanceFilterOption) => void;
  setInstrumentIds: (instrumentIds: string[]) => void;
  setStyleIds: (styleIds: string[]) => void;
  toggleInstrumentId: (instrumentId: string) => void;
  toggleStyleId: (styleId: string) => void;
  setDateFilter: (dateFilter: DateFilterOption) => void;
  resetFilters: () => void;
};

/** Version 1 replaced the absolute `startsAfter` / `startsBefore`, which went stale once persisted, with `dateFilter`. */
const PERSIST_VERSION = 1;

const initialFilters: MapFilters = {
  radiusMeters: DEFAULT_RADIUS_METERS,
  instrumentIds: [],
  styleIds: [],
  dateFilter: 'any',
};

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

export const useMapFiltersStore = create<MapFiltersState>()(
  persist(
    (set) => ({
      ...initialFilters,
      setRadiusMeters: (radiusMeters) => {
        set({ radiusMeters });
      },
      setInstrumentIds: (instrumentIds) => {
        set({ instrumentIds });
      },
      setStyleIds: (styleIds) => {
        set({ styleIds });
      },
      toggleInstrumentId: (instrumentId) => {
        set((state) => ({ instrumentIds: toggleId(state.instrumentIds, instrumentId) }));
      },
      toggleStyleId: (styleId) => {
        set((state) => ({ styleIds: toggleId(state.styleIds, styleId) }));
      },
      setDateFilter: (dateFilter) => {
        set({ dateFilter });
      },
      resetFilters: () => {
        set(initialFilters);
      },
    }),
    {
      name: 'map-filters',
      storage: createJSONStorage(() => AsyncStorage),
      version: PERSIST_VERSION,
      migrate: (persistedState) => {
        const { radiusMeters, instrumentIds, styleIds } = persistedState as Partial<MapFilters>;

        return {
          radiusMeters: radiusMeters ?? initialFilters.radiusMeters,
          instrumentIds: instrumentIds ?? initialFilters.instrumentIds,
          styleIds: styleIds ?? initialFilters.styleIds,
          dateFilter: initialFilters.dateFilter,
        } as MapFiltersState;
      },
    },
  ),
);
