import { describe, expect, it } from 'vitest';

import type { Notification } from '@/features/notifications/types';
import { notificationDataSchema } from '@/features/notifications/schemas/notification.schema';
import { resolveNotificationHref } from '@/features/notifications/utils/resolve-notification-href';

describe('notificationDataSchema', () => {
  it('accepts valid notification data', () => {
    const result = notificationDataSchema.safeParse({
      jam_id: '550e8400-e29b-41d4-a716-446655440000',
      action: 'open_jam',
      navigation_target: '/jams/550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid uuid', () => {
    const result = notificationDataSchema.safeParse({
      jam_id: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
  });
});

describe('resolveNotificationHref', () => {
  const baseNotification: Notification = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    type: 'NEW_JAM_RADIUS',
    title: 'New jam nearby',
    body: 'A new jam was created near you',
    imageUrl: null,
    data: {},
    isRead: false,
    createdAt: '2026-07-21T12:00:00.000Z',
  };

  it('uses navigation_target when provided', () => {
    const href = resolveNotificationHref({
      ...baseNotification,
      data: {
        navigationTarget: '/jams/550e8400-e29b-41d4-a716-446655440000',
      },
    });

    expect(href).toBe('/jams/550e8400-e29b-41d4-a716-446655440000');
  });

  it('falls back to jam detail route', () => {
    const href = resolveNotificationHref({
      ...baseNotification,
      data: {
        jamId: '550e8400-e29b-41d4-a716-446655440000',
      },
    });

    expect(href).toBe('/jams/550e8400-e29b-41d4-a716-446655440000');
  });
});
