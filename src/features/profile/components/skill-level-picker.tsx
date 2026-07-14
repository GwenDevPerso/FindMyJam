import { Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import type { SkillLevel } from '@/types/domain';
import { formatSkillLevel } from '@/utils/format';

const SKILL_LEVELS: SkillLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'all_levels',
];

type SkillLevelPickerProps = {
  value: SkillLevel | null;
  onChange: (value: SkillLevel | null) => void;
};

export function SkillLevelPicker({ value, onChange }: SkillLevelPickerProps): React.JSX.Element {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">Skill level</Text>

      <View className="flex-row flex-wrap gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: value === null }}
          onPress={() => {
            onChange(null);
          }}>
          <Badge label="Not set" variant={value === null ? 'solid' : 'outline'} size="md" />
        </Pressable>

        {SKILL_LEVELS.map((level) => {
          const isSelected = value === level;

          return (
            <Pressable
              key={level}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                onChange(level);
              }}>
              <Badge
                label={formatSkillLevel(level)}
                variant={isSelected ? 'solid' : 'outline'}
                size="md"
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
