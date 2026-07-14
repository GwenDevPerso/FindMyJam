import { FlatList, type ListRenderItem, View } from 'react-native';

import { AnimatedListItem } from '@/components/ui/animated-list-item';
import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { Button } from '@/components/ui/button';
import { JamCard } from '@/features/jams/components/jam-card';
import { useJams } from '@/features/jams/hooks/use-jams';
import type { JamListFilters } from '@/features/jams/types';
import type { Jam } from '@/types/domain';

type JamListProps = {
  filters?: Partial<JamListFilters>;
  enabled: boolean;
  onJamPress: (jamId: string) => void;
  onCreatePress?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

function getErrorMessage(error: Error): string {
  if (error.message.length > 0) {
    return error.message;
  }

  return 'Something went wrong while loading jams.';
}

export function JamList({
  filters,
  enabled,
  onJamPress,
  onCreatePress,
  emptyTitle,
  emptyDescription,
}: JamListProps): React.JSX.Element {
  const { data, isLoading, isError, error, refetch, isRefetching } = useJams({ filters, enabled });

  if (isLoading) {
    return <Loading message="Loading jams…" size="large" fullScreen={false} className="py-12" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load jams"
        message={getErrorMessage(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const jams = data?.jams ?? [];

  if (jams.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? 'No jams found'}
        description={
          emptyDescription ??
          'There are no upcoming jams matching your criteria. Create one or adjust your filters.'
        }
        action={
          onCreatePress !== undefined ? (
            <View>
              <JamListCreateButton onPress={onCreatePress} />
            </View>
          ) : undefined
        }
      />
    );
  }

  const renderItem: ListRenderItem<Jam> = ({ item, index }) => (
    <AnimatedListItem index={index}>
      <JamCard jam={item} onPress={onJamPress} />
    </AnimatedListItem>
  );

  return (
    <FlatList
      data={jams}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerClassName="px-4 py-2"
      refreshing={isRefetching}
      removeClippedSubviews={true}
      onRefresh={() => {
        void refetch();
      }}
    />
  );
}

type JamListCreateButtonProps = {
  onPress: () => void;
};

function JamListCreateButton({ onPress }: JamListCreateButtonProps): React.JSX.Element {
  return (
    <Button
      label="Create a jam"
      variant="primary"
      size="md"
      isLoading={false}
      onPress={onPress}
      className="rounded-full"
    />
  );
}
