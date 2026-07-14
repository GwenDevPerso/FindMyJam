import { FlatList, type ListRenderItem } from 'react-native';

import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { FriendCard } from '@/features/friends/components/friend-card';
import { useFriends } from '@/features/friends/hooks/use-friends';
import { useRemoveFriend } from '@/features/friends/hooks/use-remove-friend';
import type { FriendListItem } from '@/features/friends/types';

type FriendListProps = {
  enabled: boolean;
};

function getErrorMessage(error: Error): string {
  if (error.message.length > 0) {
    return error.message;
  }

  return 'Something went wrong while loading your friends.';
}

export function FriendList({ enabled }: FriendListProps): React.JSX.Element {
  const friendsQuery = useFriends({ enabled });
  const removeFriendMutation = useRemoveFriend();

  if (friendsQuery.isLoading) {
    return <Loading message="Loading friends…" size="large" fullScreen={false} className="py-12" />;
  }

  if (friendsQuery.isError) {
    return (
      <ErrorState
        title="Unable to load friends"
        message={getErrorMessage(friendsQuery.error)}
        onRetry={() => {
          void friendsQuery.refetch();
        }}
      />
    );
  }

  const friends = friendsQuery.data ?? [];

  if (friends.length === 0) {
    return (
      <EmptyState
        title="No friends yet"
        description="Search for musicians and send them a friend request to grow your network."
      />
    );
  }

  const renderItem: ListRenderItem<FriendListItem> = ({ item }) => (
    <FriendCard
      friend={item}
      onRemove={(friendshipId) => {
        removeFriendMutation.mutate(friendshipId);
      }}
      isRemoving={
        removeFriendMutation.isPending && removeFriendMutation.variables === item.friendshipId
      }
    />
  );

  return (
    <FlatList
      data={friends}
      keyExtractor={(item) => item.friendshipId}
      renderItem={renderItem}
      refreshing={friendsQuery.isRefetching}
      onRefresh={() => {
        void friendsQuery.refetch();
      }}
    />
  );
}
