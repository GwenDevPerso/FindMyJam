import { FlatList, type ListRenderItem } from 'react-native';

import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { FriendRequestCard } from '@/features/friends/components/friend-request-card';
import { useAcceptFriendRequest } from '@/features/friends/hooks/use-accept-friend-request';
import { useFriendRequests } from '@/features/friends/hooks/use-friend-requests';
import { useRejectFriendRequest } from '@/features/friends/hooks/use-reject-friend-request';
import type { FriendRequestItem } from '@/features/friends/types';

type FriendRequestListProps = {
  enabled: boolean;
};

function getErrorMessage(error: Error): string {
  if (error.message.length > 0) {
    return error.message;
  }

  return 'Something went wrong while loading friend requests.';
}

export function FriendRequestList({ enabled }: FriendRequestListProps): React.JSX.Element {
  const requestsQuery = useFriendRequests({ enabled });
  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();

  if (requestsQuery.isLoading) {
    return <Loading message="Loading requests…" size="large" fullScreen={false} className="py-12" />;
  }

  if (requestsQuery.isError) {
    return (
      <ErrorState
        title="Unable to load requests"
        message={getErrorMessage(requestsQuery.error)}
        onRetry={() => {
          void requestsQuery.refetch();
        }}
      />
    );
  }

  const requests = requestsQuery.data ?? [];

  if (requests.length === 0) {
    return (
      <EmptyState
        title="No pending requests"
        description="When someone sends you a friend request, it will appear here."
      />
    );
  }

  const renderItem: ListRenderItem<FriendRequestItem> = ({ item }) => (
    <FriendRequestCard
      request={item}
      onAccept={(friendshipId) => {
        acceptMutation.mutate(friendshipId);
      }}
      onReject={(friendshipId) => {
        rejectMutation.mutate(friendshipId);
      }}
      isAccepting={acceptMutation.isPending && acceptMutation.variables === item.friendshipId}
      isRejecting={rejectMutation.isPending && rejectMutation.variables === item.friendshipId}
    />
  );

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.friendshipId}
      renderItem={renderItem}
      refreshing={requestsQuery.isRefetching}
      onRefresh={() => {
        void requestsQuery.refetch();
      }}
    />
  );
}
