import { render, screen, userEvent } from '@testing-library/react-native';

import { NotificationCard } from '@/features/notifications/components/notification-card';
import type { Notification } from '@/features/notifications/types';

function buildNotification(overrides: Partial<Notification>): Notification {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    type: 'FRIEND_REQUEST',
    title: 'New friend request',
    body: 'miles wants to be your friend',
    imageUrl: null,
    data: {},
    isRead: false,
    createdAt: '2026-07-21T11:55:00.000Z',
    ...overrides,
  };
}

describe('NotificationCard', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the title, the body and how long ago it was sent', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T12:00:00.000Z'));

    await render(<NotificationCard notification={buildNotification({})} onPress={jest.fn()} />);

    expect(screen.getByText('New friend request')).toBeOnTheScreen();
    expect(screen.getByText('miles wants to be your friend')).toBeOnTheScreen();
    expect(screen.getByText('5m ago')).toBeOnTheScreen();
  });

  it('shows the first letter of the title when there is no image', async () => {
    await render(<NotificationCard notification={buildNotification({})} onPress={jest.fn()} />);

    expect(screen.getByText('N')).toBeOnTheScreen();
  });

  it('calls onPress with the notification when pressed', async () => {
    const onPress = jest.fn();
    const notification = buildNotification({});
    await render(<NotificationCard notification={notification} onPress={onPress} onDelete={jest.fn()} />);

    await userEvent.setup().press(screen.getByText('New friend request'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(notification);
  });

  it('calls onDelete with the notification on long press', async () => {
    const onPress = jest.fn();
    const onDelete = jest.fn();
    const notification = buildNotification({});
    await render(<NotificationCard notification={notification} onPress={onPress} onDelete={onDelete} />);

    await userEvent.setup().longPress(screen.getByText('New friend request'));

    expect(onDelete).toHaveBeenCalledWith(notification);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('ignores a long press when it cannot be deleted', async () => {
    const onPress = jest.fn();
    await render(<NotificationCard notification={buildNotification({})} onPress={onPress} />);

    await userEvent.setup().longPress(screen.getByText('New friend request'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByText('New friend request')).toBeOnTheScreen();
  });
});
