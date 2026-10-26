import type { Href } from 'expo-router';

import type { Notification, NotificationData, NotificationType } from '@/features/notifications/types';
import {
  notificationActionSchema,
  notificationTypeSchema,
} from '@/features/notifications/schemas/notification.schema';
import { Routes } from '@/constants/routes';

function resolveHrefFromData(type: NotificationType, data: NotificationData): Href {
  if (data.navigationTarget !== undefined && data.navigationTarget.length > 0) {
    return data.navigationTarget as Href;
  }

  if (data.action === 'open_chat' && data.jamId !== undefined) {
    return Routes.jamChat(data.jamId) as Href;
  }

  if (data.jamId !== undefined) {
    return Routes.jamDetail(data.jamId) as Href;
  }

  if (data.friendId !== undefined || data.profileId !== undefined) {
    return Routes.friends as Href;
  }

  switch (type) {
    case 'FRIEND_REQUEST':
      return Routes.friends as Href;
    case 'FRIEND_ACCEPTED':
      return Routes.friends as Href;
    case 'NEW_JAM_CITY':
    case 'NEW_JAM_RADIUS':
    case 'NEW_JAM_MATCH':
    case 'JAM_UPDATED':
    case 'JAM_STARTING_SOON':
    case 'CHAT_MESSAGE':
    case 'WAITLIST_PROMOTED':
      return Routes.jamsAll as Href;
    case 'JAM_CANCELLED':
      return Routes.jamsAll as Href;
    default:
      return Routes.notifications as Href;
  }
}

export function resolveNotificationHref(notification: Notification): Href {
  return resolveHrefFromData(notification.type, notification.data);
}

function readString(raw: Record<string, unknown>, key: string): string | undefined {
  const value = raw[key];

  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Route to open when the user taps a push notification. `raw` is the push `data` sent by the Edge Functions
 * (every value is a string). Returns null for a push that does not come from them, so the app stays where it is.
 * Only in-app paths are followed as a navigation target.
 */
export function resolvePushHref(raw: Record<string, unknown> | undefined): Href | null {
  if (raw === undefined) {
    return null;
  }

  const type = notificationTypeSchema.safeParse(raw.type);

  if (!type.success) {
    return null;
  }

  const action = notificationActionSchema.safeParse(raw.action);
  const navigationTarget = readString(raw, 'navigation_target');

  return resolveHrefFromData(type.data, {
    jamId: readString(raw, 'jam_id'),
    friendId: readString(raw, 'friend_id'),
    profileId: readString(raw, 'profile_id'),
    friendshipId: readString(raw, 'friendship_id'),
    action: action.success ? action.data : undefined,
    navigationTarget: navigationTarget?.startsWith('/') === true ? navigationTarget : undefined,
  });
}
