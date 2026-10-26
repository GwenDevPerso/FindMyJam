import { DEFAULT_RADIUS_METERS, type DateFilterOption } from '@/features/map/constants';

type JamSearchFilters = {
  radiusMeters: number;
  instrumentIds: readonly string[];
  styleIds: readonly string[];
  dateFilter: DateFilterOption;
};

type CountActiveFiltersOptions = {
  /** False where the radius is not shown (the jams list searches around a city with a fixed radius). */
  includeRadius: boolean;
};

/** Number of filters that differ from their default: each instrument and style counts once. */
export function countActiveFilters(filters: JamSearchFilters, { includeRadius }: CountActiveFiltersOptions): number {
  const radiusCount = includeRadius && filters.radiusMeters !== DEFAULT_RADIUS_METERS ? 1 : 0;
  const dateCount = filters.dateFilter === 'any' ? 0 : 1;

  return filters.instrumentIds.length + filters.styleIds.length + dateCount + radiusCount;
}
