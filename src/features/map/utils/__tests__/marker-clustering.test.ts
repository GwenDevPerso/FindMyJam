import {
  groupMarkersIntoClusters,
  isMarkerCluster,
  shouldEnableClustering,
  type MapMarkerPoint,
  type MarkerCluster,
} from '@/features/map/utils/marker-clustering';

const point: MapMarkerPoint = { id: 'jam-1', latitude: 48.85, longitude: 2.35 };
const cluster: MarkerCluster = {
  id: 'cluster-1',
  latitude: 48.85,
  longitude: 2.35,
  pointCount: 2,
  pointIds: ['jam-1', 'jam-2'],
};

describe('shouldEnableClustering', () => {
  it.each([
    [0, false],
    [99, false],
    [100, true],
    [250, true],
  ])('for %d markers returns %s', (markerCount, expected) => {
    expect(shouldEnableClustering(markerCount)).toBe(expected);
  });
});

describe('isMarkerCluster', () => {
  it('recognises a cluster', () => {
    expect(isMarkerCluster(cluster)).toBe(true);
  });

  it('does not take a single point for a cluster', () => {
    expect(isMarkerCluster(point)).toBe(false);
  });
});

describe('groupMarkersIntoClusters', () => {
  // Clustering is a documented placeholder: points come back as-is whatever the zoom.
  it('returns every point individually', () => {
    const points = [point, { id: 'jam-2', latitude: 48.85, longitude: 2.35 }];

    expect(groupMarkersIntoClusters(points, 3)).toEqual(points);
  });

  it.todo('groups nearby points into a cluster at low zoom (not implemented yet)');
});
