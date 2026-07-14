import type { Coordinates } from '@/types/geo';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'FindMyJam/1.0 (Jam Finder mobile app)';

export type NominatimPlaceResult = {
  placeId: number;
  label: string;
  latitude: number;
  longitude: number;
};

export type GeocodingRepositoryResult<T> = {
  data: T;
  error: Error | null;
};

type SearchPlacesParams = {
  query: string;
  proximity: Coordinates | null;
  limit: number;
};

function buildSearchUrl(params: SearchPlacesParams): string {
  const searchParams = new URLSearchParams({
    q: params.query,
    format: 'json',
    addressdetails: '0',
    limit: String(params.limit),
  });

  if (params.proximity !== null) {
    const { latitude, longitude } = params.proximity;
    const delta = 0.5;
    const viewbox = [
      longitude - delta,
      latitude + delta,
      longitude + delta,
      latitude - delta,
    ].join(',');
    searchParams.set('viewbox', viewbox);
    searchParams.set('bounded', '0');
  }

  return `${NOMINATIM_BASE_URL}/search?${searchParams.toString()}`;
}

function buildReverseUrl(coordinates: Coordinates): string {
  const searchParams = new URLSearchParams({
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
    format: 'json',
  });

  return `${NOMINATIM_BASE_URL}/reverse?${searchParams.toString()}`;
}

async function fetchNominatim(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });
}

export const geocodingRepository = {
  searchPlaces: async (params: SearchPlacesParams): Promise<GeocodingRepositoryResult<NominatimPlaceResult[]>> => {
    try {
      const response = await fetchNominatim(buildSearchUrl(params));

      if (!response.ok) {
        return {
          data: [],
          error: new Error(`Place search failed with status ${response.status}`),
        };
      }

      const json: unknown = await response.json();

      if (!Array.isArray(json)) {
        return { data: [], error: new Error('Invalid place search response') };
      }

      const places: NominatimPlaceResult[] = json
        .map((item): NominatimPlaceResult | null => {
          if (
            typeof item !== 'object' ||
            item === null ||
            !('place_id' in item) ||
            !('lat' in item) ||
            !('lon' in item) ||
            !('display_name' in item)
          ) {
            return null;
          }

          const row = item as {
            place_id: number;
            lat: string;
            lon: string;
            display_name: string;
          };

          const latitude = Number.parseFloat(row.lat);
          const longitude = Number.parseFloat(row.lon);

          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return null;
          }

          return {
            placeId: row.place_id,
            label: row.display_name,
            latitude,
            longitude,
          };
        })
        .filter((place): place is NominatimPlaceResult => place !== null);

      return { data: places, error: null };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Place search failed';
      return { data: [], error: new Error(message) };
    }
  },

  reverseGeocode: async (
    coordinates: Coordinates,
  ): Promise<GeocodingRepositoryResult<string | null>> => {
    try {
      const response = await fetchNominatim(buildReverseUrl(coordinates));

      if (!response.ok) {
        return {
          data: null,
          error: new Error(`Reverse geocoding failed with status ${response.status}`),
        };
      }

      const json: unknown = await response.json();

      if (
        typeof json !== 'object' ||
        json === null ||
        !('display_name' in json) ||
        typeof json.display_name !== 'string'
      ) {
        return { data: null, error: new Error('Invalid reverse geocoding response') };
      }

      return { data: json.display_name, error: null };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Reverse geocoding failed';
      return { data: null, error: new Error(message) };
    }
  },
};
