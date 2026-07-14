import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  DISTANCE_FILTER_OPTIONS,
  type DistanceFilterOption,
} from '@/features/map/constants';
import { useMapFiltersStore } from '@/store/map-filters.store';
import { cn } from '@/utils/cn';

function formatRadiusLabel(radiusMeters: DistanceFilterOption): string {
  if (radiusMeters < 1000) {
    return `${radiusMeters} m`;
  }

  return `${radiusMeters / 1000} km`;
}

export function MapFilters(): React.JSX.Element {
  const radiusMeters = useMapFiltersStore((state) => state.radiusMeters);
  const setRadiusMeters = useMapFiltersStore((state) => state.setRadiusMeters);

  return (
    <View className="rounded-2xl border border-border/50 bg-card/95 px-3 py-3">
      <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Distance
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {DISTANCE_FILTER_OPTIONS.map((option) => {
          const isSelected = radiusMeters === option;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                setRadiusMeters(option);
              }}
              className={cn(
                'rounded-full px-4 py-2',
                isSelected ? 'bg-primary' : 'bg-secondary',
              )}>
              <Text
                className={cn(
                  'text-sm font-semibold',
                  isSelected ? 'text-primary-foreground' : 'text-secondary-foreground',
                )}>
                {formatRadiusLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
