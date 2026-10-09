import { Text, View } from 'react-native';

import { AnimatedPressableScale } from '@/components/ui/animated-pressable';
import { Avatar } from '@/components/ui/avatar';
import { Badge, BadgeGroup } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserSearchResult } from '@/features/friends/types';
import { formatSkillLevel } from '@/utils/format';

type UserSearchResultCardProps = {
  user: UserSearchResult;
  onPress: (userId: string) => void;
  onSendRequest: (addresseeId: string) => void;
  onRemoveRequest: (friendshipId: string) => void;
  isSending: boolean;
  isRemoving: boolean;
};

function getRelationLabel(relation: UserSearchResult['relation']): string | null {
  switch (relation) {
    case 'friends':
      return 'Already friends';
    case 'pending_outgoing':
      return 'Request sent';
    case 'pending_incoming':
      return 'Wants to be friends';
    case 'rejected':
      return 'Request declined';
    case 'blocked':
      return 'Blocked';
    default:
      return null;
  }
}

export function UserSearchResultCard({
  user,
  onPress,
  onSendRequest,
  onRemoveRequest,
  isSending,
  isRemoving,
}: UserSearchResultCardProps): React.JSX.Element {
  const relationLabel = getRelationLabel(user.relation);
  const canSendRequest = user.relation === 'none' || user.relation === 'rejected';
  const canCancelRequest = user.relation === 'pending_outgoing' && user.friendshipId !== null;

  const handlePress = (): void => {
    onPress(user.id);
  };

  const handleSendRequest = (): void => {
    onSendRequest(user.id);
  };

  const handleCancelRequest = (): void => {
    if (user.friendshipId !== null) {
      onRemoveRequest(user.friendshipId);
    }
  };

  return (
    <Card variant="elevated" className="mb-3">
      {/* Only the identity area opens the profile: the action buttons stay outside the pressable. */}
      <AnimatedPressableScale
        accessibilityRole="button"
        accessibilityLabel={`View ${user.username}'s profile`}
        accessibilityHint="Opens the profile"
        scaleValue={0.98}
        onPress={handlePress}>
        <CardHeader className="flex-row items-center gap-3 pb-0">
          <Avatar source={user.avatarUrl} fallback={user.username} size="lg" />
          <View className="flex-1">
            <CardTitle>{user.username}</CardTitle>
            {user.locationName !== null ? (
              <Text className="text-sm text-muted-foreground">{user.locationName}</Text>
            ) : null}
          </View>
        </CardHeader>

        <CardContent>
          {user.bio !== null && user.bio.length > 0 ? (
            <Text className="text-sm leading-5 text-muted-foreground" numberOfLines={2}>
              {user.bio}
            </Text>
          ) : null}

          <BadgeGroup>
            {user.skillLevel !== null ? (
              <Badge label={formatSkillLevel(user.skillLevel)} variant="skill" size="sm" />
            ) : null}
          </BadgeGroup>

          {relationLabel !== null ? (
            <Text className="text-xs font-medium text-accent">{relationLabel}</Text>
          ) : null}
        </CardContent>
      </AnimatedPressableScale>

      <CardFooter>
        {canSendRequest ? (
          <Button
            label="Add friend"
            variant="primary"
            size="sm"
            isLoading={isSending}
            onPress={handleSendRequest}
            className="rounded-full"
          />
        ) : null}

        {canCancelRequest ? (
          <Button
            label="Cancel request"
            variant="outline"
            size="sm"
            isLoading={isRemoving}
            onPress={handleCancelRequest}
            className="rounded-full"
          />
        ) : null}
      </CardFooter>
    </Card>
  );
}
