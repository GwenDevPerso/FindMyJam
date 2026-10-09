import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { Routes } from '@/constants/routes';
import { FriendList } from '@/features/friends/components/friend-list';
import { useFriends } from '@/features/friends/hooks/use-friends';
import { useRemoveFriend } from '@/features/friends/hooks/use-remove-friend';
import type { FriendListItem } from '@/features/friends/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/friends/hooks/use-friends');
jest.mock('@/features/friends/hooks/use-remove-friend');

const mockedUseFriends = jest.mocked(useFriends);
const mockedUseRemoveFriend = jest.mocked(useRemoveFriend);
const mockedPush = jest.mocked(router.push);

type FriendsQuery = ReturnType<typeof useFriends>;

function mockFriendsQuery(overrides: Partial<Record<keyof FriendsQuery, unknown>>): jest.Mock {
  const refetch = jest.fn();

  mockedUseFriends.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isRefetching: false,
    refetch,
    ...overrides,
  } as unknown as FriendsQuery);

  return refetch;
}

function mockRemoveFriend(): jest.Mock {
  const mutate = jest.fn();

  mockedUseRemoveFriend.mockReturnValue({
    mutate,
    isPending: false,
    variables: undefined,
  } as unknown as ReturnType<typeof useRemoveFriend>);

  return mutate;
}

const friends: FriendListItem[] = [
  {
    friendshipId: 'friendship-1',
    profile: { id: 'user-7', username: 'django', avatarUrl: null },
    friendsSince: '2026-07-01T10:00:00.000Z',
  },
  {
    friendshipId: 'friendship-2',
    profile: { id: 'user-9', username: 'ella', avatarUrl: null },
    friendsSince: '2026-07-02T10:00:00.000Z',
  },
];

describe('FriendList', () => {
  beforeEach(() => {
    mockedPush.mockClear();
    mockRemoveFriend();
  });

  it('passes its enabled flag to the friends query', async () => {
    mockFriendsQuery({ isLoading: true });

    await render(<FriendList enabled={false} />);

    expect(mockedUseFriends).toHaveBeenCalledWith({ enabled: false });
  });

  it('shows a loading message while friends load', async () => {
    mockFriendsQuery({ isLoading: true });

    await render(<FriendList enabled={true} />);

    expect(screen.getByText('Loading friends…')).toBeOnTheScreen();
    expect(screen.queryByText('No friends yet')).not.toBeOnTheScreen();
  });

  it('shows the error and refetches when "Try again" is pressed', async () => {
    const refetch = mockFriendsQuery({ isError: true, error: new Error('Network request failed') });

    await render(<FriendList enabled={true} />);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Unable to load friends')).toBeOnTheScreen();
    expect(screen.getByText('Network request failed')).toBeOnTheScreen();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to a generic message when the error has none', async () => {
    mockFriendsQuery({ isError: true, error: new Error('') });

    await render(<FriendList enabled={true} />);

    expect(screen.getByText('Something went wrong while loading your friends.')).toBeOnTheScreen();
  });

  it('shows the empty state when the user has no friends', async () => {
    mockFriendsQuery({ data: [] });

    await render(<FriendList enabled={true} />);

    expect(screen.getByText('No friends yet')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('lists the friends', async () => {
    mockFriendsQuery({ data: friends });

    await render(<FriendList enabled={true} />);

    expect(screen.getByText('django')).toBeOnTheScreen();
    expect(screen.getByText('ella')).toBeOnTheScreen();
    expect(screen.queryByText('No friends yet')).not.toBeOnTheScreen();
  });

  it("opens the friend's profile when a card is pressed", async () => {
    mockFriendsQuery({ data: friends });

    await render(<FriendList enabled={true} />);
    await userEvent.setup().press(screen.getByRole('button', { name: "View ella's profile" }));

    expect(mockedPush).toHaveBeenCalledTimes(1);
    expect(mockedPush).toHaveBeenCalledWith(Routes.userProfile('user-9'));
  });

  it('removes the friend without navigating when "Remove" is pressed', async () => {
    mockFriendsQuery({ data: friends });
    const mutate = mockRemoveFriend();

    await render(<FriendList enabled={true} />);
    await userEvent.setup().press(screen.getAllByRole('button', { name: 'Remove' })[0]);

    expect(mutate).toHaveBeenCalledWith('friendship-1');
    expect(mockedPush).not.toHaveBeenCalled();
  });
});
