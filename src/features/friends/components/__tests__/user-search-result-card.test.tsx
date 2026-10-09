import { render, screen, userEvent, within } from '@testing-library/react-native';

import { UserSearchResultCard } from '@/features/friends/components/user-search-result-card';
import type { UserSearchResult } from '@/features/friends/types';

function buildUser(overrides: Partial<UserSearchResult>): UserSearchResult {
  return {
    id: 'user-3',
    username: 'miles',
    avatarUrl: null,
    bio: 'Trumpet player',
    skillLevel: 'advanced',
    locationName: 'Paris',
    relation: 'none',
    friendshipId: null,
    ...overrides,
  };
}

type Handlers = {
  onPress: jest.Mock;
  onSendRequest: jest.Mock;
  onRemoveRequest: jest.Mock;
};

async function renderCard(user: UserSearchResult): Promise<Handlers> {
  const handlers: Handlers = { onPress: jest.fn(), onSendRequest: jest.fn(), onRemoveRequest: jest.fn() };

  await render(
    <UserSearchResultCard
      user={user}
      onPress={handlers.onPress}
      onSendRequest={handlers.onSendRequest}
      onRemoveRequest={handlers.onRemoveRequest}
      isSending={false}
      isRemoving={false}
    />,
  );

  return handlers;
}

describe('UserSearchResultCard', () => {
  it('calls onPress with the user id when the card is pressed', async () => {
    const { onPress, onSendRequest, onRemoveRequest } = await renderCard(buildUser({}));

    await userEvent.setup().press(screen.getByRole('button', { name: "View miles's profile" }));

    expect(screen.getByText('miles')).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith('user-3');
    expect(onSendRequest).not.toHaveBeenCalled();
    expect(onRemoveRequest).not.toHaveBeenCalled();
  });

  it('sends a friend request without opening the profile when "Add friend" is pressed', async () => {
    const { onPress, onSendRequest } = await renderCard(buildUser({ relation: 'none' }));

    await userEvent.setup().press(screen.getByRole('button', { name: 'Add friend' }));

    expect(onSendRequest).toHaveBeenCalledTimes(1);
    expect(onSendRequest).toHaveBeenCalledWith('user-3');
    expect(onPress).not.toHaveBeenCalled();
  });

  it('cancels the pending request without opening the profile when "Cancel request" is pressed', async () => {
    const { onPress, onRemoveRequest } = await renderCard(
      buildUser({ relation: 'pending_outgoing', friendshipId: 'friendship-5' }),
    );

    await userEvent.setup().press(screen.getByRole('button', { name: 'Cancel request' }));

    expect(onRemoveRequest).toHaveBeenCalledTimes(1);
    expect(onRemoveRequest).toHaveBeenCalledWith('friendship-5');
    expect(onPress).not.toHaveBeenCalled();
  });

  it('stays pressable when no friendship action is available', async () => {
    const { onPress } = await renderCard(buildUser({ relation: 'friends', friendshipId: 'friendship-6' }));

    await userEvent.setup().press(screen.getByRole('button', { name: "View miles's profile" }));

    expect(screen.getByText('Already friends')).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledWith('user-3');
  });

  it('keeps "Add friend" outside the profile button so both stay reachable', async () => {
    await renderCard(buildUser({ relation: 'none' }));

    const profileButton = screen.getByRole('button', { name: "View miles's profile" });

    expect(screen.getByRole('button', { name: 'Add friend' })).toBeOnTheScreen();
    expect(within(profileButton).queryByRole('button', { name: 'Add friend' })).not.toBeOnTheScreen();
  });
});
