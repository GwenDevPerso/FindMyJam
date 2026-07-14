import { Text, View } from 'react-native';

import { AnimatedPressableScale } from '@/components/ui/animated-pressable';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { FriendRequestItem } from '@/features/friends/types';

type FriendRequestCardProps = {
  request: FriendRequestItem;
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
};

export function FriendRequestCard({
  request,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: FriendRequestCardProps): React.JSX.Element {
  const isBusy = isAccepting || isRejecting;

  const handleAccept = (): void => {
    onAccept(request.friendshipId);
  };

  const handleReject = (): void => {
    onReject(request.friendshipId);
  };

  return (
    <AnimatedPressableScale scaleValue={0.98} disabled={true}>
      <Card variant="elevated" className="mb-3 overflow-hidden">
        <View className="absolute left-0 top-0 h-full w-1 bg-accent" accessibilityElementsHidden />

        <CardHeader className="flex-row items-center gap-3 pb-0 pl-2">
          <Avatar source={request.profile.avatarUrl} fallback={request.profile.username} size="lg" />
          <View className="flex-1">
            <CardTitle>{request.profile.username}</CardTitle>
            <Text className="text-sm text-muted-foreground">Sent you a friend request</Text>
          </View>
        </CardHeader>

        <CardFooter className="gap-2 pl-2 pt-4">
          <Button
            label="Accept"
            variant="primary"
            size="sm"
            isLoading={isAccepting}
            disabled={isBusy}
            onPress={handleAccept}
            className="flex-1 rounded-full"
          />
          <Button
            label="Decline"
            variant="outline"
            size="sm"
            isLoading={isRejecting}
            disabled={isBusy}
            onPress={handleReject}
            className="flex-1 rounded-full"
          />
        </CardFooter>
      </Card>
    </AnimatedPressableScale>
  );
}
