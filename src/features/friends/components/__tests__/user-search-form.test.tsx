import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { Routes } from '@/constants/routes';
import { UserSearchForm } from '@/features/friends/components/user-search-form';
import { useRemoveFriend } from '@/features/friends/hooks/use-remove-friend';
import { useSearchUsers } from '@/features/friends/hooks/use-search-users';
import { useSendFriendRequest } from '@/features/friends/hooks/use-send-friend-request';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/friends/hooks/use-remove-friend');
jest.mock('@/features/friends/hooks/use-search-users');
jest.mock('@/features/friends/hooks/use-send-friend-request');
// The debounce only delays the query; return the typed value at once so the test needs no timers.
jest.mock('@/hooks/use-debounce', () => ({ useDebounce: (value: string): string => value }));

const mockedPush = jest.mocked(router.push);

describe('UserSearchForm', () => {
  beforeEach(() => {
    mockedPush.mockClear();
    jest.mocked(useSearchUsers).mockReturnValue({
      data: [
        {
          id: 'user-3',
          username: 'miles',
          avatarUrl: null,
          bio: null,
          skillLevel: null,
          locationName: null,
          relation: 'none',
          friendshipId: null,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useSearchUsers>);
    jest.mocked(useSendFriendRequest).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useSendFriendRequest>);
    jest.mocked(useRemoveFriend).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useRemoveFriend>);
  });

  it("opens a musician's profile when a search result is pressed", async () => {
    const user = userEvent.setup();

    await render(<UserSearchForm />);
    await user.type(screen.getByPlaceholderText('Search by username'), 'mil');
    await user.press(screen.getByRole('button', { name: "View miles's profile" }));

    expect(mockedPush).toHaveBeenCalledTimes(1);
    expect(mockedPush).toHaveBeenCalledWith(Routes.userProfile('user-3'));
  });
});
