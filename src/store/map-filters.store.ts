import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_RADIUS_METERS,
  type DistanceFilterOption,
} from '@/features/map/constants';

type MapFiltersState = {
  radiusMeters: DistanceFilterOption;
  instrumentIds: string[];
  styleIds: string[];
  startsAfter: string | null;
  startsBefore: string | null;
  setRadiusMeters: (radiusMeters: DistanceFilterOption) => void;
  setInstrumentIds: (instrumentIds: string[]) => void;
  setStyleIds: (styleIds: string[]) => void;
  setDateRange: (startsAfter: string | null, startsBefore: string | null) => void;
  resetFilters: () => void;
};

const initialFilters = {
  radiusMeters: DEFAULT_RADIUS_METERS,
  instrumentIds: [] as string[],
  styleIds: [] as string[],
  startsAfter: null as string | null,
  startsBefore: null as string | null,
};

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
      setDateRange: (startsAfter, startsBefore) => {
        set({ startsAfter, startsBefore });
      },
      resetFilters: () => {
        set(initialFilters);
      },
    }),
    {
      name: 'map-filters',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
