import { z } from 'zod';

const nominatimPlaceSchema = z.object({
  place_id: z.number(),
  lat: z.string(),
  lon: z.string(),
  display_name: z.string(),
});

export const nominatimSearchResponseSchema = z.array(nominatimPlaceSchema);

export const nominatimReverseResponseSchema = z.object({
  display_name: z.string(),
});

export type NominatimPlaceRow = z.infer<typeof nominatimPlaceSchema>;
