import type { Coordinates } from '@/types/geo';

export const MAP_JAM_PAGE_SIZE = 50;
export const MAP_FILTER_DEBOUNCE_MS = 300;
export const DEFAULT_MAP_REGION_DELTA = 0.08;
export const MAP_PREVIEW_HEIGHT = 192;
export const CLUSTERING_THRESHOLD = 100;

export const DISTANCE_FILTER_OPTIONS = [5_000, 10_000, 25_000, 50_000] as const;

export type DistanceFilterOption = (typeof DISTANCE_FILTER_OPTIONS)[number];

export const DEFAULT_RADIUS_METERS: DistanceFilterOption = 25_000;

/** Relative date windows offered by the filters; the range is computed when the search runs, never stored. */
export const DATE_FILTER_OPTIONS = ['any', 'today', 'weekend', 'week'] as const;

export type DateFilterOption = (typeof DATE_FILTER_OPTIONS)[number];

export const DATE_FILTER_LABELS: Record<DateFilterOption, string> = {
  any: 'Any date',
  today: 'Today',
  weekend: 'This weekend',
  week: 'Next 7 days',
};

export const FALLBACK_USER_LOCATION: Coordinates = {
  latitude: 48.8566,
  longitude: 2.3522,
};
