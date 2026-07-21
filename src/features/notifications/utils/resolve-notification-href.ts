import type { Href } from 'expo-router';

import type { Notification, NotificationData } from '@/features/notifications/types';
import { Routes } from '@/constants/routes';

export function resolveNotificationHref(notification: Notification): Href {
  const data: NotificationData = notification.data;

  if (data.navigationTarget !== undefined && data.navigationTarget.length > 0) {
    return data.navigationTarget as Href;
  }

  if (data.jamId !== undefined) {
    return Routes.jamDetail(data.jamId) as Href;
  }

  if (data.friendId !== undefined || data.profileId !== undefined) {
    return Routes.friends as Href;
  }

  switch (notification.type) {
    case 'FRIEND_REQUEST':
      return Routes.friends as Href;
    case 'FRIEND_ACCEPTED':
      return Routes.friends as Href;
    case 'NEW_JAM_CITY':
    case 'NEW_JAM_RADIUS':
    case 'NEW_JAM_MATCH':
    case 'JAM_UPDATED':
    case 'JAM_STARTING_SOON':
      return data.jamId !== undefined ? (Routes.jamDetail(data.jamId) as Href) : (Routes.jamsAll as Href);
    case 'JAM_CANCELLED':
      return Routes.jamsAll as Href;
    default:
      return Routes.notifications as Href;
  }
}
