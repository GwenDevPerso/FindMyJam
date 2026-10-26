import { notificationDataSchema } from '@/features/notifications/schemas/notification.schema';
import { resolvePushHref } from '@/features/notifications/utils/resolve-notification-href';

const JAM_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('resolvePushHref', () => {
  it('opens the chat of a chat message push', () => {
    const href = resolvePushHref({
      type: 'CHAT_MESSAGE',
      jam_id: JAM_ID,
      action: 'open_chat',
      navigation_target: `/jams/chat/${JAM_ID}`,
    });

    expect(href).toBe(`/jams/chat/${JAM_ID}`);
  });

  it('falls back to the chat route when a chat push has no navigation target', () => {
    const href = resolvePushHref({ type: 'CHAT_MESSAGE', jam_id: JAM_ID, action: 'open_chat' });

    expect(href).toBe(`/jams/chat/${JAM_ID}`);
  });

  it('falls back to the jam detail for a jam push', () => {
    const href = resolvePushHref({ type: 'JAM_UPDATED', jam_id: JAM_ID, notification_id: 'abc' });

    expect(href).toBe(`/jams/${JAM_ID}`);
  });

  it('opens the jam of a waitlist promotion push', () => {
    const href = resolvePushHref({
      type: 'WAITLIST_PROMOTED',
      jam_id: JAM_ID,
      action: 'open_jam',
      navigation_target: `/jams/${JAM_ID}`,
    });

    expect(href).toBe(`/jams/${JAM_ID}`);
  });

  it('opens the jams list for a waitlist promotion push without a jam', () => {
    expect(resolvePushHref({ type: 'WAITLIST_PROMOTED' })).toBe('/jams/all');
  });

  it('opens the friends list for a friend request push', () => {
    const href = resolvePushHref({ type: 'FRIEND_REQUEST' });

    expect(href).toBe('/friends');
  });

  it('ignores a navigation target outside the app', () => {
    const href = resolvePushHref({ type: 'SYSTEM', navigation_target: 'https://example.com' });

    expect(href).toBe('/notifications');
  });

  it('does not navigate for a push that is not one of ours', () => {
    expect(resolvePushHref({ foo: 'bar' })).toBeNull();
    expect(resolvePushHref(undefined)).toBeNull();
  });
});

describe('notificationDataSchema', () => {
  it('accepts the open_chat action', () => {
    const result = notificationDataSchema.safeParse({ jam_id: JAM_ID, action: 'open_chat' });

    expect(result.success).toBe(true);
  });
});
