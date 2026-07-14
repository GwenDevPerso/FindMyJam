import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { JamBadges } from '@/features/jams/components/jam-badges';
import { JamLocationMap } from '@/features/jams/components/jam-location-map';
import { ParticipantList } from '@/features/jams/components/participant-list';
import { useJamDetail } from '@/features/jams/hooks/use-jam-detail';
import { useJoinJam } from '@/features/jams/hooks/use-join-jam';
import { useLeaveJam } from '@/features/jams/hooks/use-leave-jam';
import { formatJamDateTime } from '@/utils/date';
import { formatParticipantCount, formatSkillLevel } from '@/utils/format';

export default function JamDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jamId = id ?? '';

  const jamQuery = useJamDetail({ jamId, enabled: jamId.length > 0 });
  const joinJam = useJoinJam();
  const leaveJam = useLeaveJam();

  if (jamQuery.isLoading) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <Loading message="Loading jam…" size="large" fullScreen={true} />
      </Screen>
    );
  }

  if (jamQuery.isError) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState
          title="Unable to load jam"
          message={jamQuery.error.message}
          onRetry={() => {
            void jamQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const jam = jamQuery.data;

  if (jam === undefined) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState title="Jam not found" message="This jam may have been removed." />
      </Screen>
    );
  }

  const canJoin = !jam.isCreator && !jam.isParticipant;
  const canLeave = jam.isParticipant;

  return (
    <Screen scrollable={true} withTabBarInset={false} contentClassName="gap-6 pb-8">
      <View className="gap-2">
        <Text className="text-2xl font-bold text-foreground">{jam.title}</Text>
        <Text className="text-sm text-muted-foreground">{formatJamDateTime(jam.startsAt)}</Text>
        <Text className="text-base text-foreground">{jam.locationName}</Text>
      </View>

      <JamLocationMap
        coordinates={{ latitude: jam.latitude, longitude: jam.longitude }}
        title={jam.title}
        locationName={jam.locationName}
      />

      {jam.description !== null && jam.description.length > 0 ? (
        <Text className="text-sm leading-6 text-muted-foreground">{jam.description}</Text>
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        <Text className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
          {formatSkillLevel(jam.skillLevel)}
        </Text>
        <Text className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
          {formatParticipantCount(jam.participantCount, jam.maxParticipants)} participants
        </Text>
      </View>

      <JamBadges instrumentIds={jam.instrumentIds} styleIds={jam.styleIds} maxVisible={6} size="md" />

      {canJoin ? (
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

      {canLeave ? (
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

      {joinJam.error !== null ? (
        <Text className="text-sm text-destructive">{joinJam.error.message}</Text>
      ) : null}

      {leaveJam.error !== null ? (
        <Text className="text-sm text-destructive">{leaveJam.error.message}</Text>
      ) : null}

      <View className="gap-3">
        <Text className="text-lg font-bold text-foreground">Participants</Text>
        <ParticipantList jamId={jam.id} enabled={true} />
      </View>
    </Screen>
  );
}
