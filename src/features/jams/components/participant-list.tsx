import { FlatList, Text, View, type ListRenderItem } from 'react-native';

import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { Avatar } from '@/components/ui/avatar';
import { useJamParticipants } from '@/features/jams/hooks/use-jam-participants';
import type { JamParticipant } from '@/types/domain';
import { formatJamDateTime } from '@/utils/date';

type ParticipantListProps = {
  jamId: string;
  enabled: boolean;
};

function getErrorMessage(error: Error): string {
  if (error.message.length > 0) {
    return error.message;
  }

  return 'Something went wrong while loading participants.';
}

function ParticipantRow({ participant }: { participant: JamParticipant }): React.JSX.Element {
  return (
    <View className="flex-row items-center gap-3 border-b border-border py-3">
      <Avatar source={participant.avatarUrl} fallback={participant.username} size="md" />
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-medium text-foreground">{participant.username}</Text>
        <Text className="text-xs text-muted-foreground">
          Joined {formatJamDateTime(participant.joinedAt)}
        </Text>
      </View>
    </View>
  );
}

export function ParticipantList({ jamId, enabled }: ParticipantListProps): React.JSX.Element {
  const { data, isLoading, isError, error, refetch, isRefetching } = useJamParticipants({
    jamId,
    enabled,
  });

  if (isLoading) {
    return <Loading message="Loading participants…" size="large" fullScreen={false} className="py-8" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load participants"
        message={getErrorMessage(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const participants = data ?? [];

  if (participants.length === 0) {
    return (
      <EmptyState
        title="No participants yet"
        description="Be the first musician to join this jam."
        className="py-8"
      />
    );
  }

  const renderItem: ListRenderItem<JamParticipant> = ({ item }) => (
    <ParticipantRow participant={item} />
  );

  return (
    <FlatList
      data={participants}
      keyExtractor={(item) => item.userId}
      renderItem={renderItem}
      scrollEnabled={false}
      refreshing={isRefetching}
      onRefresh={() => {
        void refetch();
      }}
    />
  );
}
