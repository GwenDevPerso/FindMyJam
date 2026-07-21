import type { PostgrestError } from '@supabase/supabase-js';

import type { NotificationListCursor } from '@/features/notifications/types';
import type {
  DeviceInsert,
  DeviceRow,
  DeviceUpdate,
  NotificationInsert,
  NotificationPreferencesInsert,
  NotificationPreferencesRow,
  NotificationPreferencesUpdate,
  NotificationRow,
  NotificationUpdate,
} from '@/lib/supabase/types';
import { supabase } from '@/services/supabase';

export type NotificationRepositoryResult<T> = {
  data: T;
  error: PostgrestError | null;
};

const NOTIFICATION_COLUMNS =
  'id, user_id, type, title, body, image_url, data, is_read, created_at';

const DEVICE_COLUMNS = 'id, user_id, expo_push_token, platform, app_version, created_at, updated_at';

const PREFERENCES_COLUMNS =
  'user_id, friend_requests, friend_acceptance, new_jams_city, new_jams_radius, new_matching_jams, jam_updates, jam_starting, marketing, radius_km, quiet_hours_start, quiet_hours_end, created_at, updated_at';

export type ListNotificationsParams = {
  userId: string;
  limit: number;
  cursor: NotificationListCursor | null;
};

export const notificationRepository = {
  list: async (
    params: ListNotificationsParams,
  ): Promise<NotificationRepositoryResult<NotificationRow[]>> => {
    const { data, error } = await supabase.rpc('get_user_notifications', {
      p_user_id: params.userId,
      p_limit: params.limit,
      p_cursor_created_at: params.cursor?.createdAt ?? null,
      p_cursor_id: params.cursor?.id ?? null,
    });

    return { data: data ?? [], error };
  },

  getUnreadCount: async (userId: string): Promise<NotificationRepositoryResult<number>> => {
    const { data, error } = await supabase.rpc('get_unread_notifications_count', {
      p_user_id: userId,
    });

    return { data: data ?? 0, error };
  },

  markAsRead: async (
    userId: string,
    notificationId: string,
  ): Promise<NotificationRepositoryResult<NotificationRow>> => {
    const update: NotificationUpdate = { is_read: true };

    const { data, error } = await supabase
      .from('notifications')
      .update(update)
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select(NOTIFICATION_COLUMNS)
      .single();

    if (error !== null || data === null) {
      return { data: data as unknown as NotificationRow, error };
    }

    return { data, error: null };
  },

  markAllAsRead: async (userId: string): Promise<{ error: PostgrestError | null }> => {
    const update: NotificationUpdate = { is_read: true };

    const { error } = await supabase
      .from('notifications')
      .update(update)
      .eq('user_id', userId)
      .eq('is_read', false);

    return { error };
  },

  delete: async (
    userId: string,
    notificationId: string,
  ): Promise<{ error: PostgrestError | null }> => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    return { error };
  },
};

export const deviceRepository = {
  findByUserAndToken: async (
    userId: string,
    expoPushToken: string,
  ): Promise<NotificationRepositoryResult<DeviceRow | null>> => {
    const { data, error } = await supabase
      .from('devices')
      .select(DEVICE_COLUMNS)
      .eq('user_id', userId)
      .eq('expo_push_token', expoPushToken)
      .maybeSingle();

    return { data, error };
  },

  create: async (device: DeviceInsert): Promise<NotificationRepositoryResult<DeviceRow>> => {
    const { data, error } = await supabase
      .from('devices')
      .insert(device)
      .select(DEVICE_COLUMNS)
      .single();

    if (error !== null || data === null) {
      return { data: data as unknown as DeviceRow, error };
    }

    return { data, error: null };
  },

  update: async (
    deviceId: string,
    device: DeviceUpdate,
  ): Promise<NotificationRepositoryResult<DeviceRow>> => {
    const { data, error } = await supabase
      .from('devices')
      .update(device)
      .eq('id', deviceId)
      .select(DEVICE_COLUMNS)
      .single();

    if (error !== null || data === null) {
      return { data: data as unknown as DeviceRow, error };
    }

    return { data, error: null };
  },

  deleteByToken: async (
    userId: string,
    expoPushToken: string,
  ): Promise<{ error: PostgrestError | null }> => {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('user_id', userId)
      .eq('expo_push_token', expoPushToken);

    return { error };
  },
};

export const notificationPreferencesRepository = {
  findByUserId: async (
    userId: string,
  ): Promise<NotificationRepositoryResult<NotificationPreferencesRow | null>> => {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select(PREFERENCES_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    return { data, error };
  },

  create: async (
    preferences: NotificationPreferencesInsert,
  ): Promise<NotificationRepositoryResult<NotificationPreferencesRow>> => {
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert(preferences)
      .select(PREFERENCES_COLUMNS)
      .single();

    if (error !== null || data === null) {
      return { data: data as unknown as NotificationPreferencesRow, error };
    }

    return { data, error: null };
  },

  update: async (
    userId: string,
    preferences: NotificationPreferencesUpdate,
  ): Promise<NotificationRepositoryResult<NotificationPreferencesRow>> => {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select(PREFERENCES_COLUMNS)
      .single();

    if (error !== null || data === null) {
      return { data: data as unknown as NotificationPreferencesRow, error };
    }

    return { data, error: null };
  },
};

export type { NotificationInsert };
