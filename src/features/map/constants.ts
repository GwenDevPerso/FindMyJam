import type { Coordinates } from '@/types/geo';

export const MAP_JAM_PAGE_SIZE = 50;
export const MAP_FILTER_DEBOUNCE_MS = 300;
export const DEFAULT_MAP_REGION_DELTA = 0.08;
export const MAP_PREVIEW_HEIGHT = 192;
export const CLUSTERING_THRESHOLD = 100;

export const DISTANCE_FILTER_OPTIONS = [5_000, 10_000, 25_000, 50_000] as const;

export type DistanceFilterOption = (typeof DISTANCE_FILTER_OPTIONS)[number];

export const DEFAULT_RADIUS_METERS: DistanceFilterOption = 25_000;

export const FALLBACK_USER_LOCATION: Coordinates = {
  latitude: 48.8566,
  longitude: 2.3522,
};
