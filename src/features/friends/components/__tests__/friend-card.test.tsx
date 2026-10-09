import { render, screen, userEvent, within } from '@testing-library/react-native';

import { FriendCard } from '@/features/friends/components/friend-card';
import type { FriendListItem } from '@/features/friends/types';

const friend: FriendListItem = {
  friendshipId: 'friendship-1',
  profile: { id: 'user-7', username: 'django', avatarUrl: null },
  friendsSince: '2026-07-01T10:00:00.000Z',
};

describe('FriendCard', () => {
  it('calls onPress with the friend user id when the card is pressed', async () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();
    await render(<FriendCard friend={friend} onPress={onPress} onRemove={onRemove} isRemoving={false} />);

    await userEvent.setup().press(screen.getByRole('button', { name: "View django's profile" }));

    expect(screen.getByText('django')).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith('user-7');
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('removes the friendship without opening the profile when "Remove" is pressed', async () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();
    await render(<FriendCard friend={friend} onPress={onPress} onRemove={onRemove} isRemoving={false} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Remove' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('friendship-1');
    expect(onPress).not.toHaveBeenCalled();
  });

  it('keeps "Remove" outside the profile button so both stay reachable', async () => {
    await render(<FriendCard friend={friend} onPress={jest.fn()} onRemove={jest.fn()} isRemoving={false} />);

    const profileButton = screen.getByRole('button', { name: "View django's profile" });

    expect(screen.getByRole('button', { name: 'Remove' })).toBeOnTheScreen();
    expect(within(profileButton).queryByRole('button', { name: 'Remove' })).not.toBeOnTheScreen();
  });
});
