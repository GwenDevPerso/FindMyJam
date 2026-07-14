import type { PlaceSearchParams, PlaceSuggestion } from '@/features/location/types';
import { AppError } from '@/lib/errors/app-error';
import { geocodingRepository } from '@/repositories/geocoding.repository';
import type { Coordinates } from '@/types/geo';

const MIN_QUERY_LENGTH = 3;
const DEFAULT_SEARCH_LIMIT = 5;

function assertNoError(error: Error | null): void {
  if (error !== null) {
    throw new AppError('NETWORK_ERROR', error.message, null);
  }
}

function mapPlaceResult(place: {
  placeId: number;
  label: string;
  latitude: number;
  longitude: number;
}): PlaceSuggestion {
  return {
    id: String(place.placeId),
    label: place.label,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

export const geocodingService = {
  searchPlaces: async (params: PlaceSearchParams): Promise<PlaceSuggestion[]> => {
    const trimmedQuery = params.query.trim();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      return [];
    }

    const { data, error } = await geocodingRepository.searchPlaces({
      query: trimmedQuery,
      proximity: params.proximity,
      limit: params.limit,
    });
    assertNoError(error);

    return data.map(mapPlaceResult);
  },

  reverseGeocode: async (coordinates: Coordinates): Promise<string> => {
    const { data, error } = await geocodingRepository.reverseGeocode(coordinates);
    assertNoError(error);

    if (data === null || data.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Unable to resolve address for this location', null);
    }

    return data;
  },

  getDefaultSearchLimit: (): number => DEFAULT_SEARCH_LIMIT,

  getMinQueryLength: (): number => MIN_QUERY_LENGTH,
};
