import { View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { cn } from '@/utils/cn';

type StackedAvatar = {
  id: string;
  source: string | null;
  fallback: string;
};

type AvatarStackProps = {
  avatars: StackedAvatar[];
  /** Avatars shown before the "+n" counter. */
  max: number;
  className?: string;
};

// DESIGN.md §5: round avatars overlapping by 10 with a 2px `background` ring, then a mono "+n".
export function AvatarStack({ avatars, max, className }: AvatarStackProps): React.JSX.Element {
  const shown = avatars.slice(0, max);
  const hiddenCount = avatars.length - shown.length;

  return (
    <View className={cn('flex-row items-center', className)}>
      {shown.map((avatar, index) => (
        <View key={avatar.id} className={cn('rounded-full border-2 border-background', index > 0 && '-ml-2.5')}>
          <Avatar source={avatar.source} fallback={avatar.fallback} size="sm" />
        </View>
      ))}
      {hiddenCount > 0 ? (
        <Text className="ml-2 font-mono text-xs font-semibold text-text-soft">+{hiddenCount}</Text>
      ) : null}
    </View>
  );
}
