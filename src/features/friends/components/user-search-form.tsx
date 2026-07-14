import { useMemo, useState } from 'react';
import { FlatList, Text, View, type ListRenderItem } from 'react-native';

import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { Input } from '@/components/ui/input';
import { UserSearchResultCard } from '@/features/friends/components/user-search-result-card';
import { useRemoveFriend } from '@/features/friends/hooks/use-remove-friend';
import { useSearchUsers } from '@/features/friends/hooks/use-search-users';
import { useSendFriendRequest } from '@/features/friends/hooks/use-send-friend-request';
import type { UserSearchResult } from '@/features/friends/types';
import { useDebounce } from '@/hooks/use-debounce';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_LIMIT = 20;

function getErrorMessage(error: Error): string {
  if (error.message.length > 0) {
    return error.message;
  }

  return 'Something went wrong while searching users.';
}

export function UserSearchForm(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);

  const searchInput = useMemo(
    () => ({
      query: debouncedQuery,
      instrumentIds: [] as string[],
      styleIds: [] as string[],
      limit: SEARCH_LIMIT,
    }),
    [debouncedQuery],
  );

  const searchQuery = useSearchUsers({
    input: searchInput,
    enabled: debouncedQuery.trim().length >= 2,
  });
  const sendRequestMutation = useSendFriendRequest();
  const removeFriendMutation = useRemoveFriend();

  const showHint = debouncedQuery.trim().length < 2;
  const showLoading = !showHint && searchQuery.isLoading;
  const showError = !showHint && searchQuery.isError;
  const results = searchQuery.data ?? [];

  const renderItem: ListRenderItem<UserSearchResult> = ({ item }) => (
    <UserSearchResultCard
      user={item}
      onSendRequest={(addresseeId) => {
        sendRequestMutation.mutate(addresseeId);
      }}
      onRemoveRequest={(friendshipId) => {
        removeFriendMutation.mutate(friendshipId);
      }}
      isSending={sendRequestMutation.isPending && sendRequestMutation.variables === item.id}
      isRemoving={removeFriendMutation.isPending && removeFriendMutation.variables === item.friendshipId}
    />
  );

  return (
    <View className="flex-1">
      <Input
        label="Search musicians"
        placeholder="Search by username"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        containerClassName="mb-4"
      />

      {showHint ? (
        <EmptyState
          title="Find musicians"
          description="Type at least 2 characters to search for users by username."
        />
      ) : null}

      {showLoading ? (
        <Loading message="Searching users…" size="large" fullScreen={false} className="py-12" />
      ) : null}

      {showError ? (
        <ErrorState
          title="Search failed"
          message={getErrorMessage(searchQuery.error)}
          onRetry={() => {
            void searchQuery.refetch();
          }}
        />
      ) : null}

      {!showHint && !showLoading && !showError && results.length === 0 ? (
        <EmptyState title="No users found" description="Try another username." />
      ) : null}

      {!showHint && !showLoading && !showError && results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <Text className="mb-3 text-sm text-muted-foreground">
              {results.length} result{results.length > 1 ? 's' : ''}
            </Text>
          }
        />
      ) : null}
    </View>
  );
}
