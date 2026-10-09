import { Text, View } from 'react-native';

import { AnimatedPressableScale } from '@/components/ui/animated-pressable';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { FriendListItem } from '@/features/friends/types';

type FriendCardProps = {
  friend: FriendListItem;
  onPress: (userId: string) => void;
  onRemove: (friendshipId: string) => void;
  isRemoving: boolean;
};

export function FriendCard({ friend, onPress, onRemove, isRemoving }: FriendCardProps): React.JSX.Element {
  const handlePress = (): void => {
    onPress(friend.profile.id);
  };

  const handleRemove = (): void => {
    onRemove(friend.friendshipId);
  };

  return (
    <Card variant="elevated" className="mb-3">
      {/* Only the identity area opens the profile: the action button stays outside the pressable. */}
      <AnimatedPressableScale
        accessibilityRole="button"
        accessibilityLabel={`View ${friend.profile.username}'s profile`}
        accessibilityHint="Opens the profile"
        scaleValue={0.98}
        onPress={handlePress}>
        <CardHeader className="flex-row items-center gap-3 pb-0">
          <Avatar source={friend.profile.avatarUrl} fallback={friend.profile.username} size="lg" />
          <View className="flex-1">
            <CardTitle>{friend.profile.username}</CardTitle>
            <Text className="text-sm text-muted-foreground">Friend</Text>
          </View>
        </CardHeader>
      </AnimatedPressableScale>

      <CardFooter className="pt-4">
        <Button
          label="Remove"
          variant="outline"
          size="sm"
          isLoading={isRemoving}
          onPress={handleRemove}
          className="rounded-full"
        />
      </CardFooter>
    </Card>
  );
}
