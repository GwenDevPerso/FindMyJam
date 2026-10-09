import { render, screen, userEvent, within } from '@testing-library/react-native';

import { FriendRequestCard } from '@/features/friends/components/friend-request-card';
import type { FriendRequestItem } from '@/features/friends/types';

const request: FriendRequestItem = {
  friendshipId: 'friendship-2',
  profile: { id: 'user-9', username: 'ella', avatarUrl: null },
  requestedAt: '2026-07-01T10:00:00.000Z',
};

type Handlers = {
  onPress: jest.Mock;
  onAccept: jest.Mock;
  onReject: jest.Mock;
};

async function renderCard(): Promise<Handlers> {
  const handlers: Handlers = { onPress: jest.fn(), onAccept: jest.fn(), onReject: jest.fn() };

  await render(
    <FriendRequestCard
      request={request}
      onPress={handlers.onPress}
      onAccept={handlers.onAccept}
      onReject={handlers.onReject}
      isAccepting={false}
      isRejecting={false}
    />,
  );

  return handlers;
}

describe('FriendRequestCard', () => {
  it('calls onPress with the requester user id when the card is pressed', async () => {
    const { onPress, onAccept, onReject } = await renderCard();

    await userEvent.setup().press(screen.getByRole('button', { name: "View ella's profile" }));

    expect(screen.getByText('ella')).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith('user-9');
    expect(onAccept).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });

  it('accepts the request without opening the profile when "Accept" is pressed', async () => {
    const { onPress, onAccept, onReject } = await renderCard();

    await userEvent.setup().press(screen.getByRole('button', { name: 'Accept' }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith('friendship-2');
    expect(onReject).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('declines the request without opening the profile when "Decline" is pressed', async () => {
    const { onPress, onAccept, onReject } = await renderCard();

    await userEvent.setup().press(screen.getByRole('button', { name: 'Decline' }));

    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledWith('friendship-2');
    expect(onAccept).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('keeps "Accept" and "Decline" outside the profile button so all three stay reachable', async () => {
    await renderCard();

    const profileButton = screen.getByRole('button', { name: "View ella's profile" });

    expect(screen.getByRole('button', { name: 'Accept' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeOnTheScreen();
    expect(within(profileButton).queryByRole('button', { name: 'Accept' })).not.toBeOnTheScreen();
    expect(within(profileButton).queryByRole('button', { name: 'Decline' })).not.toBeOnTheScreen();
  });
});
