import type { Coordinates, GeoBounds, MapRegion } from '@/types/geo';

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateDistanceMeters(from: Coordinates, to: Coordinates): number {
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);

  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_METERS * centralAngle;
}

export function coordinatesToRegion(coordinates: Coordinates, delta: number): MapRegion {
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function regionToBounds(region: MapRegion): GeoBounds {
  const halfLatDelta = region.latitudeDelta / 2;
  const halfLonDelta = region.longitudeDelta / 2;

  return {
    northEast: {
      latitude: region.latitude + halfLatDelta,
      longitude: region.longitude + halfLonDelta,
    },
    southWest: {
      latitude: region.latitude - halfLatDelta,
      longitude: region.longitude - halfLonDelta,
    },
  };
}
