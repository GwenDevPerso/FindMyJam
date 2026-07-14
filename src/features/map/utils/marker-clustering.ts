import { CLUSTERING_THRESHOLD } from '@/features/map/constants';

export type MapMarkerPoint = {
  id: string;
  latitude: number;
  longitude: number;
};

export type MarkerCluster = {
  id: string;
  latitude: number;
  longitude: number;
  pointCount: number;
  pointIds: string[];
};

export type MapRenderableMarker = MapMarkerPoint | MarkerCluster;

export function isMarkerCluster(marker: MapRenderableMarker): marker is MarkerCluster {
  return 'pointCount' in marker;
}

export function shouldEnableClustering(markerCount: number): boolean {
  return markerCount >= CLUSTERING_THRESHOLD;
}

/**
 * Placeholder for future supercluster integration.
 * Returns individual points until clustering is wired to the map viewport zoom.
 */
export function groupMarkersIntoClusters(
  points: MapMarkerPoint[],
  _zoom: number,
): MapRenderableMarker[] {
  return points;
}
