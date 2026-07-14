import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';

import type { UserLocation } from '@/features/map/types';
import { queryKeys } from '@/lib/query/keys';

type UseUserLocationOptions = {
  enabled: boolean;
};

export function useUserLocation({ enabled }: UseUserLocationOptions) {
  return useQuery({
    queryKey: queryKeys.map.userLocation(),
    queryFn: async (): Promise<UserLocation | null> => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    },
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}
