export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'NEW_JAM_CITY'
  | 'NEW_JAM_RADIUS'
  | 'NEW_JAM_MATCH'
  | 'JAM_UPDATED'
  | 'JAM_CANCELLED'
  | 'JAM_STARTING_SOON'
  | 'SYSTEM';

export type NotificationAction =
  | 'open_jam'
  | 'open_friend_requests'
  | 'open_friends'
  | 'open_jams'
  | 'open_profile'
  | 'open_notifications';

export type NotificationData = {
  jamId?: string;
  friendId?: string;
  profileId?: string;
  friendshipId?: string;
  action?: NotificationAction;
  navigationTarget?: string;
  minutesBefore?: number;
};

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string | null;
  data: NotificationData;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListCursor = {
  createdAt: string;
  id: string;
};

export type NotificationListResult = {
  notifications: Notification[];
  nextCursor: NotificationListCursor | null;
};

export type NotificationPreferences = {
  userId: string;
  friendRequests: boolean;
  friendAcceptance: boolean;
  newJamsCity: boolean;
  newJamsRadius: boolean;
  newMatchingJams: boolean;
  jamUpdates: boolean;
  jamStarting: boolean;
  marketing: boolean;
  radiusKm: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateNotificationPreferencesInput = {
  friendRequests?: boolean;
  friendAcceptance?: boolean;
  newJamsCity?: boolean;
  newJamsRadius?: boolean;
  newMatchingJams?: boolean;
  jamUpdates?: boolean;
  jamStarting?: boolean;
  marketing?: boolean;
  radiusKm?: number;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
};

export type DevicePlatform = 'ios' | 'android' | 'web';

export type Device = {
  id: string;
  userId: string;
  expoPushToken: string;
  platform: DevicePlatform;
  appVersion: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RegisterDeviceInput = {
  expoPushToken: string;
  platform: DevicePlatform;
  appVersion: string | null;
};
