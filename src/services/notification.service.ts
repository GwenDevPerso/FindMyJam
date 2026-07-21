import type { PostgrestError } from '@supabase/supabase-js';

import type {
  Notification,
  NotificationData,
  NotificationListCursor,
  NotificationListResult,
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
} from '@/features/notifications/types';
import { updateNotificationPreferencesSchema } from '@/features/notifications/schemas/notification.schema';
import { AppError } from '@/lib/errors/app-error';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import type { NotificationPreferencesRow, NotificationRow } from '@/lib/supabase/types';
import {
  notificationPreferencesRepository,
  notificationRepository,
} from '@/repositories/notification.repository';

const DEFAULT_LIST_LIMIT = 20;

function assertNoError(error: PostgrestError | null): void {
  if (error !== null) {
    throw mapSupabaseError(error);
  }
}

function mapNotificationData(raw: Record<string, unknown>): NotificationData {
  return {
    jamId: typeof raw.jam_id === 'string' ? raw.jam_id : undefined,
    friendId: typeof raw.friend_id === 'string' ? raw.friend_id : undefined,
    profileId: typeof raw.profile_id === 'string' ? raw.profile_id : undefined,
    friendshipId: typeof raw.friendship_id === 'string' ? raw.friendship_id : undefined,
    action:
      typeof raw.action === 'string'
        ? (raw.action as NotificationData['action'])
        : undefined,
    navigationTarget:
      typeof raw.navigation_target === 'string' ? raw.navigation_target : undefined,
    minutesBefore: typeof raw.minutes_before === 'number' ? raw.minutes_before : undefined,
  };
}

function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    data: mapNotificationData(row.data as Record<string, unknown>),
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

function mapPreferencesRow(row: NotificationPreferencesRow): NotificationPreferences {
  return {
    userId: row.user_id,
    friendRequests: row.friend_requests,
    friendAcceptance: row.friend_acceptance,
    newJamsCity: row.new_jams_city,
    newJamsRadius: row.new_jams_radius,
    newMatchingJams: row.new_matching_jams,
    jamUpdates: row.jam_updates,
    jamStarting: row.jam_starting,
    marketing: row.marketing,
    radiusKm: row.radius_km,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildNextCursor(
  notifications: Notification[],
  limit: number,
): NotificationListCursor | null {
  if (notifications.length < limit) {
    return null;
  }

  const lastNotification = notifications[notifications.length - 1];

  return {
    createdAt: lastNotification.createdAt,
    id: lastNotification.id,
  };
}

function mapPreferencesUpdate(input: UpdateNotificationPreferencesInput): Record<string, boolean | number | string | null> {
  const update: Record<string, boolean | number | string | null> = {};

  if (input.friendRequests !== undefined) {
    update.friend_requests = input.friendRequests;
  }
  if (input.friendAcceptance !== undefined) {
    update.friend_acceptance = input.friendAcceptance;
  }
  if (input.newJamsCity !== undefined) {
    update.new_jams_city = input.newJamsCity;
  }
  if (input.newJamsRadius !== undefined) {
    update.new_jams_radius = input.newJamsRadius;
  }
  if (input.newMatchingJams !== undefined) {
    update.new_matching_jams = input.newMatchingJams;
  }
  if (input.jamUpdates !== undefined) {
    update.jam_updates = input.jamUpdates;
  }
  if (input.jamStarting !== undefined) {
    update.jam_starting = input.jamStarting;
  }
  if (input.marketing !== undefined) {
    update.marketing = input.marketing;
  }
  if (input.radiusKm !== undefined) {
    update.radius_km = input.radiusKm;
  }
  if (input.quietHoursStart !== undefined) {
    update.quiet_hours_start = input.quietHoursStart;
  }
  if (input.quietHoursEnd !== undefined) {
    update.quiet_hours_end = input.quietHoursEnd;
  }

  return update;
}

export const notificationService = {
  list: async (
    userId: string,
    limit: number = DEFAULT_LIST_LIMIT,
    cursor: NotificationListCursor | null = null,
  ): Promise<NotificationListResult> => {
    const { data, error } = await notificationRepository.list({
      userId,
      limit,
      cursor,
    });
    assertNoError(error);

    const notifications = data.map(mapNotificationRow);

    return {
      notifications,
      nextCursor: buildNextCursor(notifications, limit),
    };
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const { data, error } = await notificationRepository.getUnreadCount(userId);
    assertNoError(error);

    return data;
  },

  markAsRead: async (userId: string, notificationId: string): Promise<Notification> => {
    const { data, error } = await notificationRepository.markAsRead(userId, notificationId);
    assertNoError(error);

    return mapNotificationRow(data);
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    const { error } = await notificationRepository.markAllAsRead(userId);
    assertNoError(error);
  },

  delete: async (userId: string, notificationId: string): Promise<void> => {
    const { error } = await notificationRepository.delete(userId, notificationId);
    assertNoError(error);
  },

  getPreferences: async (userId: string): Promise<NotificationPreferences> => {
    const { data, error } = await notificationPreferencesRepository.findByUserId(userId);
    assertNoError(error);

    if (data === null) {
      const { data: created, error: createError } = await notificationPreferencesRepository.create({
        user_id: userId,
      });
      assertNoError(createError);

      return mapPreferencesRow(created);
    }

    return mapPreferencesRow(data);
  },

  updatePreferences: async (
    userId: string,
    input: UpdateNotificationPreferencesInput,
  ): Promise<NotificationPreferences> => {
    const validated = updateNotificationPreferencesSchema.parse(input);
    const update = mapPreferencesUpdate(validated);

    const { data, error } = await notificationPreferencesRepository.update(userId, update);
    assertNoError(error);

    return mapPreferencesRow(data);
  },
};
