import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import {
  DATE_FILTER_LABELS,
  DATE_FILTER_OPTIONS,
  DISTANCE_FILTER_OPTIONS,
  type DistanceFilterOption,
} from '@/features/map/constants';
import { countActiveFilters } from '@/features/map/utils/active-filters';
import { MultiSelectChips } from '@/features/profile/components/multi-select-chips';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import { useMapFiltersStore } from '@/store/map-filters.store';
import { cn } from '@/utils/cn';

type MapFiltersProps = {
  /** The jams list searches around a city with a fixed radius, so it hides the distance choice. */
  showDistance: boolean;
};

function formatRadiusLabel(radiusMeters: DistanceFilterOption): string {
  if (radiusMeters < 1000) {
    return `${radiusMeters} m`;
  }

  return `${radiusMeters / 1000} km`;
}

function formatActiveFiltersLabel(count: number): string {
  return `${count} active filter${count === 1 ? '' : 's'}`;
}

type FilterChipProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

function FilterChip({ label, isSelected, onPress }: FilterChipProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className={cn('border px-4 py-2', isSelected ? 'border-primary bg-primary' : 'border-border-strong bg-transparent')}>
      <Text
        className={cn(
          'text-xs font-medium uppercase tracking-label',
          isSelected ? 'text-primary-foreground' : 'text-text-soft',
        )}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }): React.JSX.Element {
  return (
    <Text className="mb-2 text-xs font-medium uppercase tracking-label text-muted-foreground">{title}</Text>
  );
}

function InstrumentAndStyleFilters(): React.JSX.Element {
  const instrumentIds = useMapFiltersStore((state) => state.instrumentIds);
  const styleIds = useMapFiltersStore((state) => state.styleIds);
  const toggleInstrumentId = useMapFiltersStore((state) => state.toggleInstrumentId);
  const toggleStyleId = useMapFiltersStore((state) => state.toggleStyleId);

  const instrumentsQuery = useReferenceInstruments({ enabled: true });
  const musicStylesQuery = useReferenceMusicStyles({ enabled: true });

  if (instrumentsQuery.isLoading || musicStylesQuery.isLoading) {
    return <Text className="text-sm text-muted-foreground">Loading instruments and styles…</Text>;
  }

  if (instrumentsQuery.isError || musicStylesQuery.isError) {
    return (
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm text-destructive">Could not load instruments and styles.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void instrumentsQuery.refetch();
            void musicStylesQuery.refetch();
          }}
          className="border border-border-strong px-3 py-1.5">
          <Text className="text-xs font-medium uppercase tracking-label text-text-soft">Retry</Text>
        </Pressable>
      </View>
    );
  }

  const instruments = instrumentsQuery.data ?? [];
  const musicStyles = musicStylesQuery.data ?? [];

  if (instruments.length === 0 && musicStyles.length === 0) {
    return <Text className="text-sm text-muted-foreground">No instruments or styles available.</Text>;
  }

  return (
    <ScrollView className="max-h-64" contentContainerClassName="gap-4" nestedScrollEnabled={true}>
      <MultiSelectChips
        label="Instruments"
        options={instruments}
        selectedIds={instrumentIds}
        variant="instrument"
        onToggle={toggleInstrumentId}
      />
      <MultiSelectChips
        label="Music styles"
        options={musicStyles}
        selectedIds={styleIds}
        variant="style"
        onToggle={toggleStyleId}
      />
    </ScrollView>
  );
}

export function MapFilters({ showDistance }: MapFiltersProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  const radiusMeters = useMapFiltersStore((state) => state.radiusMeters);
  const instrumentIds = useMapFiltersStore((state) => state.instrumentIds);
  const styleIds = useMapFiltersStore((state) => state.styleIds);
  const dateFilter = useMapFiltersStore((state) => state.dateFilter);
  const setRadiusMeters = useMapFiltersStore((state) => state.setRadiusMeters);
  const setDateFilter = useMapFiltersStore((state) => state.setDateFilter);
  const resetFilters = useMapFiltersStore((state) => state.resetFilters);

  const activeFilterCount = countActiveFilters(
    { radiusMeters, instrumentIds, styleIds, dateFilter },
    { includeRadius: showDistance },
  );

  return (
    <View className="gap-3 border border-border bg-card/95 px-3 py-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-medium uppercase tracking-label text-foreground">Filters</Text>

        {activeFilterCount > 0 ? (
          <View
            accessible={true}
            accessibilityLabel={formatActiveFiltersLabel(activeFilterCount)}
            className="min-w-5 items-center rounded-full bg-primary px-1.5 py-0.5">
            <Text className="text-xs font-bold text-primary-foreground">{activeFilterCount}</Text>
          </View>
        ) : null}

        <View className="flex-1" />

        {activeFilterCount > 0 ? (
          <Pressable accessibilityRole="button" onPress={resetFilters} className="px-2 py-1">
            <Text className="text-xs font-medium uppercase tracking-label text-primary-text">Reset</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          onPress={() => {
            setIsExpanded((current) => !current);
          }}
          className="px-2 py-1">
          <Text className="text-xs font-medium uppercase tracking-label text-foreground">
            {isExpanded ? 'Fewer filters' : 'More filters'}
          </Text>
        </Pressable>
      </View>

      {showDistance ? (
        <View>
          <SectionTitle title="Distance" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {DISTANCE_FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option}
                label={formatRadiusLabel(option)}
                isSelected={radiusMeters === option}
                onPress={() => {
                  setRadiusMeters(option);
                }}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View>
        <SectionTitle title="Date" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {DATE_FILTER_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              label={DATE_FILTER_LABELS[option]}
              isSelected={dateFilter === option}
              onPress={() => {
                setDateFilter(option);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {isExpanded ? <InstrumentAndStyleFilters /> : null}
    </View>
  );
}
