import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { InstrumentBadge } from '@/components/ui/instrument-badge';
import { StyleBadge } from '@/components/ui/style-badge';
import { cn } from '@/utils/cn';

type ChipOption = {
  id: string;
  name: string;
  slug?: string;
};

type MultiSelectChipsProps = {
  label: string;
  options: ChipOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  variant: 'instrument' | 'style';
};

export function MultiSelectChips({
  label,
  options,
  selectedIds,
  onToggle,
  variant,
}: MultiSelectChipsProps): React.JSX.Element {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);

          return (
            <SelectableChip
              key={option.id}
              option={option}
              isSelected={isSelected}
              variant={variant}
              onToggle={onToggle}
            />
          );
        })}
      </View>
    </View>
  );
}

type SelectableChipProps = {
  option: ChipOption;
  isSelected: boolean;
  variant: 'instrument' | 'style';
  onToggle: (id: string) => void;
};

function SelectableChip({
  option,
  isSelected,
  variant,
  onToggle,
}: SelectableChipProps): React.JSX.Element {
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isSelected ? 1.05 : 1, { damping: 15, stiffness: 300 }) }],
  }));

  const handlePress = (): void => {
    onToggle(option.id);
  };

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={option.name}
        onPress={handlePress}
        className={cn(isSelected && 'opacity-100', !isSelected && 'opacity-80')}>
        {variant === 'instrument' ? (
          <InstrumentBadge
            name={option.name}
            slug={option.slug ?? 'default'}
            size="md"
            className={cn(isSelected && 'border-primary bg-primary/20')}
          />
        ) : (
          <StyleBadge
            name={option.name}
            slug={option.slug ?? 'default'}
            size="md"
            className={cn(isSelected && 'border-2 border-primary')}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}
