import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'FRIEND_REQUEST',
  'FRIEND_ACCEPTED',
  'NEW_JAM_CITY',
  'NEW_JAM_RADIUS',
  'NEW_JAM_MATCH',
  'JAM_UPDATED',
  'JAM_CANCELLED',
  'JAM_STARTING_SOON',
  'SYSTEM',
]);

export const notificationActionSchema = z.enum([
  'open_jam',
  'open_friend_requests',
  'open_friends',
  'open_jams',
  'open_profile',
  'open_notifications',
]);

export const notificationDataSchema = z.object({
  jam_id: z.string().uuid().optional(),
  friend_id: z.string().uuid().optional(),
  profile_id: z.string().uuid().optional(),
  friendship_id: z.string().uuid().optional(),
  action: notificationActionSchema.optional(),
  navigation_target: z.string().optional(),
  minutes_before: z.number().int().positive().optional(),
});

export const notificationRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  image_url: z.string().nullable(),
  data: notificationDataSchema,
  is_read: z.boolean(),
  created_at: z.string(),
});

export const notificationListParamsSchema = z.object({
  limit: z.number().int().min(1).max(100),
  cursor: z
    .object({
      createdAt: z.string(),
      id: z.string().uuid(),
    })
    .nullable(),
});

export const updateNotificationPreferencesSchema = z.object({
  friendRequests: z.boolean().optional(),
  friendAcceptance: z.boolean().optional(),
  newJamsCity: z.boolean().optional(),
  newJamsRadius: z.boolean().optional(),
  newMatchingJams: z.boolean().optional(),
  jamUpdates: z.boolean().optional(),
  jamStarting: z.boolean().optional(),
  marketing: z.boolean().optional(),
  radiusKm: z.number().int().min(1).max(500).optional(),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
});

export const registerDeviceSchema = z.object({
  expoPushToken: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  appVersion: z.string().nullable(),
});
