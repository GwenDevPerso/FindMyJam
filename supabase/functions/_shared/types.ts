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

export type NotificationData = {
  jam_id?: string;
  friend_id?: string;
  profile_id?: string;
  friendship_id?: string;
  action?: string;
  navigation_target?: string;
  minutes_before?: number;
};

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string | null;
  data?: NotificationData;
};

export type DeviceRow = {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: string;
  app_version: string | null;
};

export type NotificationPreferencesRow = {
  user_id: string;
  friend_requests: boolean;
  friend_acceptance: boolean;
  new_jams_city: boolean;
  new_jams_radius: boolean;
  new_matching_jams: boolean;
  jam_updates: boolean;
  jam_starting: boolean;
  marketing: boolean;
  radius_km: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
};

export type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export type JamRow = {
  id: string;
  creator_id: string;
  title: string;
  starts_at: string;
};

export type NewJamRecipientRow = {
  user_id: string;
  notification_type: NotificationType;
};

export type JamStartingRow = {
  jam_id: string;
  title: string;
  starts_at: string;
  creator_id: string;
};
