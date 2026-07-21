-- Notification types
CREATE TYPE public.notification_type AS ENUM (
  'FRIEND_REQUEST',
  'FRIEND_ACCEPTED',
  'NEW_JAM_CITY',
  'NEW_JAM_RADIUS',
  'NEW_JAM_MATCH',
  'JAM_UPDATED',
  'JAM_CANCELLED',
  'JAM_STARTING_SOON',
  'SYSTEM'
);

-- Devices (Expo push tokens)
CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  platform text NOT NULL,
  app_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT devices_platform_valid CHECK (platform IN ('ios', 'android', 'web')),
  CONSTRAINT devices_expo_push_token_not_empty CHECK (char_length(trim(expo_push_token)) > 0)
);

CREATE UNIQUE INDEX devices_user_token_unique_idx
  ON public.devices (user_id, expo_push_token);

CREATE INDEX devices_user_id_idx ON public.devices (user_id);

-- User notification preferences
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  friend_requests boolean NOT NULL DEFAULT true,
  friend_acceptance boolean NOT NULL DEFAULT true,
  new_jams_city boolean NOT NULL DEFAULT true,
  new_jams_radius boolean NOT NULL DEFAULT true,
  new_matching_jams boolean NOT NULL DEFAULT true,
  jam_updates boolean NOT NULL DEFAULT true,
  jam_starting boolean NOT NULL DEFAULT true,
  marketing boolean NOT NULL DEFAULT false,
  radius_km integer NOT NULL DEFAULT 25,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_radius_km_positive CHECK (radius_km > 0 AND radius_km <= 500)
);

-- Notifications inbox
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT notifications_body_not_empty CHECK (char_length(trim(body)) > 0)
);

CREATE INDEX notifications_user_id_created_at_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX notifications_user_id_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX notifications_type_idx ON public.notifications (type);

-- Prevent duplicate jam starting notifications
CREATE TABLE public.jam_starting_notification_log (
  jam_id uuid NOT NULL REFERENCES public.jams (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  minutes_before integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (jam_id, user_id, minutes_before),
  CONSTRAINT jam_starting_minutes_before_valid CHECK (minutes_before IN (60, 15))
);

-- updated_at triggers
CREATE TRIGGER devices_set_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Default preferences on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_create_notification_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_notification_preferences();

-- Backfill preferences for existing profiles
INSERT INTO public.notification_preferences (user_id)
SELECT p.id
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- pg_net for async edge function invocation (runs after transaction commit)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
