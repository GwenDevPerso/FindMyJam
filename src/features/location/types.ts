import type { Coordinates } from '@/types/geo';

export type PlaceSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type PlaceSearchParams = {
  query: string;
  proximity: Coordinates | null;
  limit: number;
};
