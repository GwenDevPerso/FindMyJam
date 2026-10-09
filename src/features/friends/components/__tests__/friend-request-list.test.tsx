import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { Routes } from '@/constants/routes';
import { FriendRequestList } from '@/features/friends/components/friend-request-list';
import { useAcceptFriendRequest } from '@/features/friends/hooks/use-accept-friend-request';
import { useFriendRequests } from '@/features/friends/hooks/use-friend-requests';
import { useRejectFriendRequest } from '@/features/friends/hooks/use-reject-friend-request';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/friends/hooks/use-accept-friend-request');
jest.mock('@/features/friends/hooks/use-friend-requests');
jest.mock('@/features/friends/hooks/use-reject-friend-request');

const mockedPush = jest.mocked(router.push);

describe('FriendRequestList', () => {
  beforeEach(() => {
    mockedPush.mockClear();
    jest.mocked(useFriendRequests).mockReturnValue({
      data: [
        {
          friendshipId: 'friendship-2',
          profile: { id: 'user-9', username: 'ella', avatarUrl: null },
          requestedAt: '2026-07-01T10:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useFriendRequests>);
    jest.mocked(useAcceptFriendRequest).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useAcceptFriendRequest>);
    jest.mocked(useRejectFriendRequest).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useRejectFriendRequest>);
  });

  it("opens the requester's profile when a card is pressed", async () => {
    await render(<FriendRequestList enabled={true} />);
    await userEvent.setup().press(screen.getByRole('button', { name: "View ella's profile" }));

    expect(mockedPush).toHaveBeenCalledTimes(1);
    expect(mockedPush).toHaveBeenCalledWith(Routes.userProfile('user-9'));
  });
});
