import { MAX_AREA_SEARCH_RADIUS_METERS } from '@/features/map/constants';
import { getAreaSearchRadius, isOutsideSearchArea } from '@/features/map/utils/search-area';
import { regionRadiusMeters } from '@/utils/geo';

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const CITY_REGION = { ...PARIS, latitudeDelta: 0.08, longitudeDelta: 0.08 };

describe('getAreaSearchRadius', () => {
  it('uses the visible radius, rounded to whole metres', () => {
    expect(getAreaSearchRadius(CITY_REGION)).toBe(Math.round(regionRadiusMeters(CITY_REGION)));
  });

  it('is capped when zoomed out far', () => {
    expect(getAreaSearchRadius({ ...PARIS, latitudeDelta: 10, longitudeDelta: 10 })).toBe(
      MAX_AREA_SEARCH_RADIUS_METERS,
    );
  });
});

describe('isOutsideSearchArea', () => {
  const CITY_SEARCH = { center: PARIS, radiusMeters: getAreaSearchRadius(CITY_REGION) };
  const WIDE_SEARCH = { center: PARIS, radiusMeters: MAX_AREA_SEARCH_RADIUS_METERS };

  it('is false when the map still shows the searched area', () => {
    expect(isOutsideSearchArea(CITY_SEARCH, CITY_REGION)).toBe(false);
  });

  it('is false for a small pan', () => {
    expect(isOutsideSearchArea(CITY_SEARCH, { ...CITY_REGION, latitude: PARIS.latitude + 0.005 })).toBe(false);
  });

  it('is true once the map moved past a share of the visible radius', () => {
    expect(isOutsideSearchArea(CITY_SEARCH, { ...CITY_REGION, latitude: PARIS.latitude + 0.03 })).toBe(true);
  });

  it('is true when zooming out on the same centre', () => {
    expect(isOutsideSearchArea(CITY_SEARCH, { ...PARIS, latitudeDelta: 0.3, longitudeDelta: 0.3 })).toBe(true);
  });

  it('is false when zooming in on the same centre', () => {
    expect(isOutsideSearchArea(CITY_SEARCH, { ...PARIS, latitudeDelta: 0.02, longitudeDelta: 0.02 })).toBe(false);
  });

  it('is false for a small pan inside a wide search', () => {
    expect(isOutsideSearchArea(WIDE_SEARCH, { ...CITY_REGION, latitude: PARIS.latitude + 0.03 })).toBe(false);
  });

  it('is false when zoomed out past the cap on the same centre of a capped search', () => {
    expect(isOutsideSearchArea(WIDE_SEARCH, { ...PARIS, latitudeDelta: 10, longitudeDelta: 10 })).toBe(false);
  });

  it('is true when the map moved out of a wide search', () => {
    expect(isOutsideSearchArea(WIDE_SEARCH, { ...CITY_REGION, latitude: PARIS.latitude + 1 })).toBe(true);
  });
});
