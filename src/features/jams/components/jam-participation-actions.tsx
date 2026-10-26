import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useJamWaitlist } from '@/features/jams/hooks/use-jam-waitlist';
import { useJoinJam } from '@/features/jams/hooks/use-join-jam';
import { useJoinWaitlist } from '@/features/jams/hooks/use-join-waitlist';
import { useLeaveJam } from '@/features/jams/hooks/use-leave-jam';
import { useLeaveWaitlist } from '@/features/jams/hooks/use-leave-waitlist';
import type { JamDetail, JamWaitlistStatus } from '@/features/jams/types';

type JamParticipationActionsProps = {
  jam: JamDetail;
};

function formatWaitlistSize(size: number): string {
  if (size === 0) {
    return 'This jam is full. Nobody is waiting yet.';
  }

  return `This jam is full. ${size} ${size === 1 ? 'person is' : 'people are'} waiting.`;
}

type WaitlistActionsProps = {
  jamId: string;
};

function WaitlistActions({ jamId }: WaitlistActionsProps): React.JSX.Element {
  const waitlistQuery = useJamWaitlist({ jamId, enabled: true });
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();

  if (waitlistQuery.isLoading) {
    return <Text className="text-sm text-muted-foreground">Checking the waitlist…</Text>;
  }

  if (waitlistQuery.isError || waitlistQuery.data === undefined) {
    return (
      <View className="gap-2">
        <Text className="text-sm text-destructive">Could not load the waitlist.</Text>
        <Button
          label="Retry"
          variant="outline"
          size="md"
          isLoading={false}
          onPress={() => {
            void waitlistQuery.refetch();
          }}
        />
      </View>
    );
  }

  const status: JamWaitlistStatus = waitlistQuery.data;

  return (
    <View className="gap-2">
      {status.position !== null ? (
        <>
          <Text className="text-base font-semibold text-foreground">{`You're #${status.position} on the waitlist`}</Text>
          <Text className="text-sm text-muted-foreground">
            You will join automatically when a spot opens up, and get a notification.
          </Text>
          <Button
            label="Leave waitlist"
            variant="outline"
            size="lg"
            isLoading={leaveWaitlist.isPending}
            onPress={() => {
              leaveWaitlist.mutate(jamId);
            }}
          />
        </>
      ) : (
        <>
          <Text className="text-sm text-muted-foreground">{formatWaitlistSize(status.size)}</Text>
          <Button
            label="Join waitlist"
            variant="primary"
            size="lg"
            isLoading={joinWaitlist.isPending}
            onPress={() => {
              joinWaitlist.mutate(jamId);
            }}
          />
        </>
      )}

      {joinWaitlist.error !== null ? (
        <Text className="text-sm text-destructive">{joinWaitlist.error.message}</Text>
      ) : null}

      {leaveWaitlist.error !== null ? (
        <Text className="text-sm text-destructive">{leaveWaitlist.error.message}</Text>
      ) : null}
    </View>
  );
}

/** Join / leave buttons of the jam screen; a full jam offers its waitlist instead of joining. */
export function JamParticipationActions({ jam }: JamParticipationActionsProps): React.JSX.Element | null {
  const joinJam = useJoinJam();
  const leaveJam = useLeaveJam();

  const isFull = jam.participantCount >= jam.maxParticipants;
  const canJoin = !jam.isCreator && !jam.isParticipant;
  const showsWaitlist = canJoin && isFull;

  if (jam.isCreator) {
    return null;
  }

  return (
    <View className="gap-2">
      {showsWaitlist ? <WaitlistActions jamId={jam.id} /> : null}

      {canJoin && !isFull ? (
        <Button
          label="Join jam"
          variant="primary"
          size="lg"
          isLoading={joinJam.isPending}
          onPress={() => {
            joinJam.mutate(jam.id);
          }}
        />
      ) : null}

      {jam.isParticipant ? (
        <Button
          label="Leave jam"
          variant="outline"
          size="lg"
          isLoading={leaveJam.isPending}
          onPress={() => {
            leaveJam.mutate(jam.id);
          }}
        />
      ) : null}

      {joinJam.error !== null ? <Text className="text-sm text-destructive">{joinJam.error.message}</Text> : null}

      {leaveJam.error !== null ? <Text className="text-sm text-destructive">{leaveJam.error.message}</Text> : null}
    </View>
  );
}
