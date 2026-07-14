import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

import { Input } from '@/components/ui/input';
import { usePlaceSearch } from '@/features/location/hooks/use-place-search';
import type { PlaceSuggestion } from '@/features/location/types';
import { useTheme } from '@/hooks/use-theme';
import { geocodingService } from '@/services/geocoding.service';
import type { Coordinates } from '@/types/geo';

type LocationAutocompleteInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
  onBlur?: () => void;
  proximity: Coordinates | null;
  label?: string;
  placeholder?: string;
  error?: string;
};

export function LocationAutocompleteInput({
  value,
  onChangeText,
  onSelect,
  onBlur,
  proximity,
  label,
  placeholder,
  error,
}: LocationAutocompleteInputProps): React.JSX.Element {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placeSearchQuery = usePlaceSearch({
    query: value,
    proximity,
    enabled: isFocused,
  });

  const suggestions = placeSearchQuery.data ?? [];
  const minQueryLength = geocodingService.getMinQueryLength();
  const showSuggestions =
    isFocused &&
    value.trim().length >= minQueryLength &&
    (placeSearchQuery.isFetching || suggestions.length > 0 || placeSearchQuery.isError);

  const handleFocus = (): void => {
    if (blurTimerRef.current !== null) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }

    setIsFocused(true);
  };

  const handleBlur = (): void => {
    blurTimerRef.current = setTimeout(() => {
      setIsFocused(false);
      onBlur?.();
    }, 150);
  };

  const handleSelect = useCallback(
    (place: PlaceSuggestion): void => {
      if (blurTimerRef.current !== null) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }

      setIsFocused(false);
      onSelect(place);
    },
    [onSelect],
  );

  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  const renderSuggestion: ListRenderItem<PlaceSuggestion> = ({ item }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        handleSelect(item);
      }}
      className="border-b border-border px-3 py-3 active:bg-secondary">
      <Text className="text-sm text-foreground" numberOfLines={2}>
        {item.label}
      </Text>
    </Pressable>
  );

  return (
    <View className="relative z-10">
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        error={error}
        autoCorrect={false}
        autoCapitalize="words"
      />

      {showSuggestions ? (
        <View className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-card shadow-md">
          {placeSearchQuery.isFetching ? (
            <View className="items-center py-4">
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : null}

          {!placeSearchQuery.isFetching && placeSearchQuery.isError ? (
            <Text className="px-3 py-3 text-sm text-destructive">
              Unable to search locations. Check your connection.
            </Text>
          ) : null}

          {!placeSearchQuery.isFetching && !placeSearchQuery.isError && suggestions.length === 0 ? (
            <Text className="px-3 py-3 text-sm text-muted-foreground">No places found</Text>
          ) : null}

          {!placeSearchQuery.isFetching && suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={renderSuggestion}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={{ maxHeight: 220 }}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
