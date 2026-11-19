import { type Href, router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Routes } from '@/constants/routes';
import { useJamWaitlist } from '@/features/jams/hooks/use-jam-waitlist';
import { useJoinJam } from '@/features/jams/hooks/use-join-jam';
import { useJoinWaitlist } from '@/features/jams/hooks/use-join-waitlist';
import { useLeaveJam } from '@/features/jams/hooks/use-leave-jam';
import { useLeaveWaitlist } from '@/features/jams/hooks/use-leave-waitlist';
import type { JamDetail } from '@/features/jams/types';
import { useTheme } from '@/hooks/use-theme';

type JamDetailFooterProps = {
  jam: JamDetail;
};

function ErrorMessage({ error }: { error: Error | null }): React.JSX.Element | null {
  return error !== null ? <Text className="text-sm text-destructive">{error.message}</Text> : null;
}

function OpenChatButton({ jamId }: { jamId: string }): React.JSX.Element {
  return (
    <Button
      label="Open chat →"
      variant="primary"
      size="lg"
      isLoading={false}
      className="flex-1"
      onPress={() => {
        router.push(Routes.jamChat(jamId) as Href);
      }}
    />
  );
}

function WaitlistButton({ jamId }: { jamId: string }): React.JSX.Element {
  const waitlistQuery = useJamWaitlist({ jamId, enabled: true });
  const joinWaitlist = useJoinWaitlist();
  const leaveWaitlist = useLeaveWaitlist();

  if (waitlistQuery.isError) {
    return (
      <View className="gap-2">
        <Text className="text-sm text-destructive">Could not load the waitlist.</Text>
        <Button
          label="Try again"
          variant="ghost"
          size="md"
          isLoading={false}
          onPress={() => {
            void waitlistQuery.refetch();
          }}
        />
      </View>
    );
  }

  const isWaiting = waitlistQuery.data !== undefined && waitlistQuery.data.position !== null;

  return (
    <View className="gap-2">
      {isWaiting ? (
        <Button
          label="Leave the waitlist"
          variant="secondary"
          size="lg"
          isLoading={leaveWaitlist.isPending}
          onPress={() => {
            leaveWaitlist.mutate(jamId);
          }}
        />
      ) : (
        <Button
          label="Join the waitlist"
          variant="primary"
          size="lg"
          isLoading={waitlistQuery.isLoading || joinWaitlist.isPending}
          onPress={() => {
            joinWaitlist.mutate(jamId);
          }}
        />
      )}
      <ErrorMessage error={joinWaitlist.error} />
      <ErrorMessage error={leaveWaitlist.error} />
    </View>
  );
}

/** Actions pinned under the jam screen: chat and edit for the creator, chat and leave for a participant, join (or
 * the waitlist of a full jam) for everyone else. */
export function JamDetailFooter({ jam }: JamDetailFooterProps): React.JSX.Element {
  const theme = useTheme();
  const joinJam = useJoinJam();
  const leaveJam = useLeaveJam();

  const isFull = jam.participantCount >= jam.maxParticipants;

  return (
    <View className="gap-2.5 border-t border-border-strong bg-card px-5 pb-4 pt-3.5">
      {jam.isCreator ? (
        <View className="flex-row gap-2.5">
          <OpenChatButton jamId={jam.id} />
          <Button
            label="Edit"
            variant="ghost"
            size="lg"
            isLoading={false}
            onPress={() => {
              router.push(Routes.jamEdit(jam.id) as Href);
            }}
          />
        </View>
      ) : null}

      {jam.isParticipant ? (
        <>
          <View className="flex-row gap-2.5">
            <OpenChatButton jamId={jam.id} />
            <Button
              label="Leave"
              variant="ghost"
              size="lg"
              isLoading={leaveJam.isPending}
              onPress={() => {
                leaveJam.mutate(jam.id);
              }}
            />
          </View>
          <ErrorMessage error={leaveJam.error} />
        </>
      ) : null}

      {!jam.isCreator && !jam.isParticipant ? (
        <>
          {isFull ? (
            <WaitlistButton jamId={jam.id} />
          ) : (
            <Button
              label="Join"
              variant="primary"
              size="lg"
              isLoading={joinJam.isPending}
              onPress={() => {
                joinJam.mutate(jam.id);
              }}
            />
          )}
          <ErrorMessage error={joinJam.error} />
          <View className="flex-row items-center justify-center gap-1.5">
            <Lock size={14} color={theme.mutedForeground} strokeWidth={1.8} />
            <Text className="text-xs text-muted-foreground">The chat opens to musicians once they join</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
