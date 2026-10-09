import { calculateDistanceMeters, coordinatesToRegion, regionToBounds } from '@/utils/geo';

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const LYON = { latitude: 45.764, longitude: 4.8357 };

describe('calculateDistanceMeters', () => {
  it('returns 0 for the same point', () => {
    expect(calculateDistanceMeters(PARIS, PARIS)).toBe(0);
  });

  it('measures Paris to Lyon at about 391.5 km', () => {
    const distance = calculateDistanceMeters(PARIS, LYON);

    expect(distance).toBeGreaterThan(391_000);
    expect(distance).toBeLessThan(392_000);
  });

  it('is the same in both directions', () => {
    expect(calculateDistanceMeters(PARIS, LYON)).toBeCloseTo(calculateDistanceMeters(LYON, PARIS), 6);
  });

  it('measures one degree of latitude at about 111.2 km', () => {
    const distance = calculateDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });

    expect(distance).toBeCloseTo(111_195, 0);
  });

  it('measures antipodal points on the equator at half the circumference', () => {
    const distance = calculateDistanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 });

    expect(distance).toBeCloseTo(Math.PI * 6_371_000, 0);
  });

  it('takes the short way across the antimeridian', () => {
    const distance = calculateDistanceMeters({ latitude: 0, longitude: 179.5 }, { latitude: 0, longitude: -179.5 });

    expect(distance).toBeCloseTo(111_195, 0);
  });
});

describe('coordinatesToRegion', () => {
  it('centres the region on the coordinates with the same delta on both axes', () => {
    expect(coordinatesToRegion(PARIS, 0.08)).toEqual({
      latitude: 48.8566,
      longitude: 2.3522,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    });
  });
});

describe('regionToBounds', () => {
  it('extends half of each delta around the centre', () => {
    const bounds = regionToBounds({ latitude: 10, longitude: 20, latitudeDelta: 2, longitudeDelta: 4 });

    expect(bounds).toEqual({
      northEast: { latitude: 11, longitude: 22 },
      southWest: { latitude: 9, longitude: 18 },
    });
  });
});
