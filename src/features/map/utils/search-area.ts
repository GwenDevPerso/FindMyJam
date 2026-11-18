import { AREA_SEARCH_MOVE_RATIO, MAX_AREA_SEARCH_RADIUS_METERS } from '@/features/map/constants';
import type { Coordinates, MapRegion } from '@/types/geo';
import { calculateDistanceMeters, regionRadiusMeters } from '@/utils/geo';

/** `search_jams` takes an integer radius. */
export function getAreaSearchRadius(region: MapRegion): number {
  return Math.round(Math.min(regionRadiusMeters(region), MAX_AREA_SEARCH_RADIUS_METERS));
}

export type SearchArea = {
  center: Coordinates;
  radiusMeters: number;
};

/**
 * Whether the visible map reaches past the searched circle by more than a share of its own radius: true after a
 * large enough pan or a zoom out, never after a zoom in or a small pan inside a wide search.
 */
export function isOutsideSearchArea(search: SearchArea, region: MapRegion): boolean {
  const visibleRadius = getAreaSearchRadius(region);

  return calculateDistanceMeters(search.center, region) + visibleRadius * (1 - AREA_SEARCH_MOVE_RATIO) > search.radiusMeters;
}
