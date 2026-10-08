-- FindMyJam baseline schema.
-- Rebuilds the whole database on an empty Supabase project. Not created here: the Vault secrets
-- (project_url, service_role_key) and the Edge Functions deployment.

-- ============================================================================
-- Extensions, enums and utility functions
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
-- pg_net for async edge function invocation (runs after transaction commit)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enums
CREATE TYPE public.skill_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'all_levels'
);

CREATE TYPE public.friendship_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'blocked'
);

-- Shared trigger function: auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Geography point from lat/lng (nullable-safe)
CREATE OR REPLACE FUNCTION public.make_geography_point(
  p_latitude double precision,
  p_longitude double precision
)
RETURNS extensions.geography(Point, 4326)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_latitude IS NULL OR p_longitude IS NULL THEN NULL
    WHEN p_latitude < -90 OR p_latitude > 90 THEN NULL
    WHEN p_longitude < -180 OR p_longitude > 180 THEN NULL
    ELSE extensions.st_setsrid(
      extensions.st_makepoint(p_longitude, p_latitude),
      4326
    )::extensions.geography
  END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'username'), ''),
      'user_' || substr(replace(NEW.id::text, '-', ''), 1, 8)
    )
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Tables
-- ============================================================================

-- Reference tables
CREATE TABLE public.instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT instruments_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT instruments_slug_not_empty CHECK (char_length(trim(slug)) > 0),
  CONSTRAINT instruments_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE public.music_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT music_styles_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT music_styles_slug_not_empty CHECK (char_length(trim(slug)) > 0),
  CONSTRAINT music_styles_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- User profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username extensions.citext NOT NULL,
  avatar_url text,
  bio text,
  skill_level public.skill_level,
  location_name text,
  latitude double precision,
  longitude double precision,
  location extensions.geography(Point, 4326) GENERATED ALWAYS AS (
    public.make_geography_point(latitude, longitude)
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_not_empty CHECK (char_length(trim(username::text)) >= 3),
  CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500),
  CONSTRAINT profiles_latitude_range CHECK (
    latitude IS NULL OR (latitude >= -90 AND latitude <= 90)
  ),
  CONSTRAINT profiles_longitude_range CHECK (
    longitude IS NULL OR (longitude >= -180 AND longitude <= 180)
  ),
  CONSTRAINT profiles_location_pair CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL)
  )
);

-- Jams
CREATE TABLE public.jams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  location_name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  location extensions.geography(Point, 4326) GENERATED ALWAYS AS (
    public.make_geography_point(latitude, longitude)
  ) STORED,
  skill_level public.skill_level NOT NULL DEFAULT 'all_levels',
  max_participants integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jams_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT jams_description_length CHECK (
    description IS NULL OR char_length(description) <= 2000
  ),
  CONSTRAINT jams_location_name_not_empty CHECK (char_length(trim(location_name)) > 0),
  CONSTRAINT jams_latitude_range CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT jams_longitude_range CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT jams_max_participants_positive CHECK (max_participants >= 2)
);

-- Jam participation
CREATE TABLE public.jam_participants (
  jam_id uuid NOT NULL REFERENCES public.jams (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (jam_id, user_id)
);

-- Friendships
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id)
);

-- Junction tables
CREATE TABLE public.user_instruments (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES public.instruments (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, instrument_id)
);

CREATE TABLE public.user_music_styles (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  music_style_id uuid NOT NULL REFERENCES public.music_styles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, music_style_id)
);

CREATE TABLE public.jam_instruments (
  jam_id uuid NOT NULL REFERENCES public.jams (id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES public.instruments (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (jam_id, instrument_id)
);

CREATE TABLE public.jam_styles (
  jam_id uuid NOT NULL REFERENCES public.jams (id) ON DELETE CASCADE,
  music_style_id uuid NOT NULL REFERENCES public.music_styles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (jam_id, music_style_id)
);

-- ============================================================================
-- Triggers and indexes
-- ============================================================================

-- updated_at triggers
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER jams_set_updated_at
  BEFORE UPDATE ON public.jams
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER friendships_set_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auth signup → profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enforce jam capacity before joining
CREATE OR REPLACE FUNCTION public.check_jam_capacity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_max_participants integer;
  v_current_count integer;
BEGIN
  SELECT max_participants
  INTO v_max_participants
  FROM public.jams
  WHERE id = NEW.jam_id;

  IF v_max_participants IS NULL THEN
    RAISE EXCEPTION 'Jam % does not exist', NEW.jam_id;
  END IF;

  SELECT count(*)
  INTO v_current_count
  FROM public.jam_participants
  WHERE jam_id = NEW.jam_id;

  IF v_current_count >= v_max_participants THEN
    RAISE EXCEPTION 'Jam % is full (% / % participants)', NEW.jam_id, v_current_count, v_max_participants;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER jam_participants_check_capacity
  BEFORE INSERT ON public.jam_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.check_jam_capacity();

-- Prevent creator from joining their own jam as participant
CREATE OR REPLACE FUNCTION public.check_jam_participant_not_creator()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_creator_id uuid;
BEGIN
  SELECT creator_id
  INTO v_creator_id
  FROM public.jams
  WHERE id = NEW.jam_id;

  IF v_creator_id = NEW.user_id THEN
    RAISE EXCEPTION 'Jam creator cannot join as participant';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER jam_participants_check_not_creator
  BEFORE INSERT ON public.jam_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.check_jam_participant_not_creator();

-- Unique constraints (case-insensitive username via citext)
CREATE UNIQUE INDEX profiles_username_unique_idx ON public.profiles (username);
CREATE UNIQUE INDEX instruments_slug_unique_idx ON public.instruments (slug);
CREATE UNIQUE INDEX instruments_name_unique_idx ON public.instruments (lower(name));
CREATE UNIQUE INDEX music_styles_slug_unique_idx ON public.music_styles (slug);
CREATE UNIQUE INDEX music_styles_name_unique_idx ON public.music_styles (lower(name));

-- Foreign key lookup indexes
CREATE INDEX jams_creator_id_idx ON public.jams (creator_id);
CREATE INDEX jams_starts_at_idx ON public.jams (starts_at);
CREATE INDEX jam_participants_user_id_idx ON public.jam_participants (user_id);
CREATE INDEX jam_participants_joined_at_idx ON public.jam_participants (joined_at DESC);

CREATE INDEX friendships_requester_id_idx ON public.friendships (requester_id);
CREATE INDEX friendships_addressee_id_idx ON public.friendships (addressee_id);
CREATE INDEX friendships_status_idx ON public.friendships (status);
CREATE UNIQUE INDEX friendships_unique_pair_idx
  ON public.friendships (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  );
CREATE INDEX friendships_pending_addressee_idx
  ON public.friendships (addressee_id)
  WHERE status = 'pending';

CREATE INDEX user_instruments_instrument_id_idx ON public.user_instruments (instrument_id);
CREATE INDEX user_music_styles_music_style_id_idx ON public.user_music_styles (music_style_id);
CREATE INDEX jam_instruments_instrument_id_idx ON public.jam_instruments (instrument_id);
CREATE INDEX jam_styles_music_style_id_idx ON public.jam_styles (music_style_id);

-- Geographic search (GiST)
CREATE INDEX profiles_location_gist_idx ON public.profiles USING gist (location);
CREATE INDEX jams_location_gist_idx ON public.jams USING gist (location);

-- Composite index for date + geo filtered queries
CREATE INDEX jams_starts_at_location_idx ON public.jams (starts_at, id)
  WHERE location IS NOT NULL;

-- Text search on username (trigram)
CREATE INDEX profiles_username_trgm_idx
  ON public.profiles
  USING gin ((username::text) extensions.gin_trgm_ops);

-- Instrument / style filter via junction tables
CREATE INDEX jam_instruments_jam_id_idx ON public.jam_instruments (jam_id);
CREATE INDEX jam_styles_jam_id_idx ON public.jam_styles (jam_id);

-- ============================================================================
-- Row level security
-- ============================================================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_music_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_styles ENABLE ROW LEVEL SECURITY;

-- Helper: is jam creator
CREATE OR REPLACE FUNCTION public.is_jam_creator(p_jam_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jams
    WHERE id = p_jam_id
      AND creator_id = p_user_id
  );
$$;

-- Helper: is jam participant
CREATE OR REPLACE FUNCTION public.is_jam_participant(p_jam_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jam_participants
    WHERE jam_id = p_jam_id
      AND user_id = p_user_id
  );
$$;

-- profiles
CREATE POLICY profiles_select_authenticated
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- jams
CREATE POLICY jams_select_authenticated
  ON public.jams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY jams_insert_own
  ON public.jams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY jams_update_creator
  ON public.jams
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY jams_delete_creator
  ON public.jams
  FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- jam_participants
CREATE POLICY jam_participants_select_authenticated
  ON public.jam_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY jam_participants_insert_own
  ON public.jam_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY jam_participants_delete_own_or_creator
  ON public.jam_participants
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_jam_creator(jam_id, auth.uid())
  );

-- friendships
CREATE POLICY friendships_select_involved
  ON public.friendships
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id
    OR auth.uid() = addressee_id
  );

CREATE POLICY friendships_insert_requester
  ON public.friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY friendships_update_addressee
  ON public.friendships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY friendships_delete_involved
  ON public.friendships
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = requester_id
    OR auth.uid() = addressee_id
  );

-- Reference tables: read-only for clients
CREATE POLICY instruments_select_authenticated
  ON public.instruments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY music_styles_select_authenticated
  ON public.music_styles
  FOR SELECT
  TO authenticated
  USING (true);

-- user_instruments
CREATE POLICY user_instruments_select_authenticated
  ON public.user_instruments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY user_instruments_insert_own
  ON public.user_instruments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_instruments_delete_own
  ON public.user_instruments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- user_music_styles
CREATE POLICY user_music_styles_select_authenticated
  ON public.user_music_styles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY user_music_styles_insert_own
  ON public.user_music_styles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_music_styles_delete_own
  ON public.user_music_styles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- jam_instruments
CREATE POLICY jam_instruments_select_authenticated
  ON public.jam_instruments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY jam_instruments_insert_creator
  ON public.jam_instruments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_jam_creator(jam_id, auth.uid()));

CREATE POLICY jam_instruments_delete_creator
  ON public.jam_instruments
  FOR DELETE
  TO authenticated
  USING (public.is_jam_creator(jam_id, auth.uid()));

-- jam_styles
CREATE POLICY jam_styles_select_authenticated
  ON public.jam_styles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY jam_styles_insert_creator
  ON public.jam_styles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_jam_creator(jam_id, auth.uid()));

CREATE POLICY jam_styles_delete_creator
  ON public.jam_styles
  FOR DELETE
  TO authenticated
  USING (public.is_jam_creator(jam_id, auth.uid()));

-- Grant execute on helper functions to authenticated
GRANT EXECUTE ON FUNCTION public.is_jam_creator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_jam_participant(uuid, uuid) TO authenticated;

-- ============================================================================
-- Search and pagination functions
-- ============================================================================

-- Participant count helper (used in search results)
CREATE OR REPLACE FUNCTION public.get_jam_participant_count(p_jam_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.jam_participants
  WHERE jam_id = p_jam_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_jam_participant_count(uuid) TO authenticated;

-- Search jams: geographic + instrument + style + date + keyset pagination
CREATE OR REPLACE FUNCTION public.search_jams(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer,
  p_instrument_ids uuid[] DEFAULT NULL,
  p_style_ids uuid[] DEFAULT NULL,
  p_starts_after timestamptz DEFAULT now(),
  p_starts_before timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_cursor_distance double precision DEFAULT NULL,
  p_cursor_starts_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  creator_id uuid,
  title text,
  description text,
  starts_at timestamptz,
  location_name text,
  latitude double precision,
  longitude double precision,
  skill_level public.skill_level,
  max_participants integer,
  participant_count integer,
  distance_meters double precision,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH origin AS (
    SELECT public.make_geography_point(p_latitude, p_longitude) AS geom
  ),
  filtered AS (
    SELECT
      j.id,
      j.creator_id,
      j.title,
      j.description,
      j.starts_at,
      j.location_name,
      j.latitude,
      j.longitude,
      j.skill_level,
      j.max_participants,
      public.get_jam_participant_count(j.id) AS participant_count,
      extensions.st_distance(j.location, origin.geom) AS distance_meters,
      j.created_at,
      j.updated_at
    FROM public.jams j
    CROSS JOIN origin
    WHERE j.location IS NOT NULL
      AND origin.geom IS NOT NULL
      AND j.starts_at >= p_starts_after
      AND (p_starts_before IS NULL OR j.starts_at <= p_starts_before)
      AND extensions.st_dwithin(j.location, origin.geom, p_radius_meters)
      AND (
        p_instrument_ids IS NULL
        OR cardinality(p_instrument_ids) = 0
        OR EXISTS (
          SELECT 1
          FROM public.jam_instruments ji
          WHERE ji.jam_id = j.id
            AND ji.instrument_id = ANY (p_instrument_ids)
        )
      )
      AND (
        p_style_ids IS NULL
        OR cardinality(p_style_ids) = 0
        OR EXISTS (
          SELECT 1
          FROM public.jam_styles js
          WHERE js.jam_id = j.id
            AND js.music_style_id = ANY (p_style_ids)
        )
      )
  )
  SELECT
    f.id,
    f.creator_id,
    f.title,
    f.description,
    f.starts_at,
    f.location_name,
    f.latitude,
    f.longitude,
    f.skill_level,
    f.max_participants,
    f.participant_count,
    f.distance_meters,
    f.created_at,
    f.updated_at
  FROM filtered f
  WHERE
    p_cursor_id IS NULL
    OR (
      f.distance_meters,
      f.starts_at,
      f.id
    ) > (
      p_cursor_distance,
      p_cursor_starts_at,
      p_cursor_id
    )
  ORDER BY f.distance_meters ASC, f.starts_at ASC, f.id ASC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.search_jams(
  double precision,
  double precision,
  integer,
  uuid[],
  uuid[],
  timestamptz,
  timestamptz,
  integer,
  double precision,
  timestamptz,
  uuid
) TO authenticated;

-- Search profiles by username + optional instrument/style filters + pagination
CREATE OR REPLACE FUNCTION public.search_profiles(
  p_query text DEFAULT NULL,
  p_instrument_ids uuid[] DEFAULT NULL,
  p_style_ids uuid[] DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_cursor_username extensions.citext DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  username extensions.citext,
  avatar_url text,
  bio text,
  skill_level public.skill_level,
  location_name text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    p.id,
    p.username,
    p.avatar_url,
    p.bio,
    p.skill_level,
    p.location_name,
    p.latitude,
    p.longitude,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE
    (
      p_query IS NULL
      OR char_length(trim(p_query)) = 0
      OR p.username ILIKE '%' || trim(p_query) || '%'
    )
    AND (
      p_instrument_ids IS NULL
      OR cardinality(p_instrument_ids) = 0
      OR EXISTS (
        SELECT 1
        FROM public.user_instruments ui
        WHERE ui.user_id = p.id
          AND ui.instrument_id = ANY (p_instrument_ids)
      )
    )
    AND (
      p_style_ids IS NULL
      OR cardinality(p_style_ids) = 0
      OR EXISTS (
        SELECT 1
        FROM public.user_music_styles ums
        WHERE ums.user_id = p.id
          AND ums.music_style_id = ANY (p_style_ids)
      )
    )
    AND (
      p_cursor_id IS NULL
      OR (p.username, p.id) > (p_cursor_username, p_cursor_id)
    )
  ORDER BY p.username ASC, p.id ASC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles(
  text,
  uuid[],
  uuid[],
  integer,
  extensions.citext,
  uuid
) TO authenticated;

-- Search profiles nearby (for map / local musician discovery)
CREATE OR REPLACE FUNCTION public.search_profiles_nearby(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer,
  p_instrument_ids uuid[] DEFAULT NULL,
  p_style_ids uuid[] DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_cursor_distance double precision DEFAULT NULL,
  p_cursor_username extensions.citext DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  username extensions.citext,
  avatar_url text,
  bio text,
  skill_level public.skill_level,
  location_name text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH origin AS (
    SELECT public.make_geography_point(p_latitude, p_longitude) AS geom
  ),
  filtered AS (
    SELECT
      p.id,
      p.username,
      p.avatar_url,
      p.bio,
      p.skill_level,
      p.location_name,
      p.latitude,
      p.longitude,
      extensions.st_distance(p.location, origin.geom) AS distance_meters,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    CROSS JOIN origin
    WHERE p.location IS NOT NULL
      AND origin.geom IS NOT NULL
      AND extensions.st_dwithin(p.location, origin.geom, p_radius_meters)
      AND (
        p_instrument_ids IS NULL
        OR cardinality(p_instrument_ids) = 0
        OR EXISTS (
          SELECT 1
          FROM public.user_instruments ui
          WHERE ui.user_id = p.id
            AND ui.instrument_id = ANY (p_instrument_ids)
        )
      )
      AND (
        p_style_ids IS NULL
        OR cardinality(p_style_ids) = 0
        OR EXISTS (
          SELECT 1
          FROM public.user_music_styles ums
          WHERE ums.user_id = p.id
            AND ums.music_style_id = ANY (p_style_ids)
        )
      )
  )
  SELECT
    f.id,
    f.username,
    f.avatar_url,
    f.bio,
    f.skill_level,
    f.location_name,
    f.latitude,
    f.longitude,
    f.distance_meters,
    f.created_at,
    f.updated_at
  FROM filtered f
  WHERE
    p_cursor_id IS NULL
    OR (
      f.distance_meters,
      f.username,
      f.id
    ) > (
      p_cursor_distance,
      p_cursor_username,
      p_cursor_id
    )
  ORDER BY f.distance_meters ASC, f.username ASC, f.id ASC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles_nearby(
  double precision,
  double precision,
  integer,
  uuid[],
  uuid[],
  integer,
  double precision,
  extensions.citext,
  uuid
) TO authenticated;

-- List jams created by a user (paginated)
CREATE OR REPLACE FUNCTION public.get_user_created_jams(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_cursor_starts_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS SETOF public.jams
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT j.*
  FROM public.jams j
  WHERE j.creator_id = p_user_id
    AND (
      p_cursor_id IS NULL
      OR (j.starts_at, j.id) < (p_cursor_starts_at, p_cursor_id)
    )
  ORDER BY j.starts_at DESC, j.id DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_user_created_jams(
  uuid,
  integer,
  timestamptz,
  uuid
) TO authenticated;

-- List jams a user participates in (paginated)
CREATE OR REPLACE FUNCTION public.get_user_participated_jams(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_cursor_starts_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  jam public.jams,
  joined_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT j, jp.joined_at
  FROM public.jam_participants jp
  INNER JOIN public.jams j ON j.id = jp.jam_id
  WHERE jp.user_id = p_user_id
    AND (
      p_cursor_id IS NULL
      OR (j.starts_at, j.id) < (p_cursor_starts_at, p_cursor_id)
    )
  ORDER BY j.starts_at DESC, j.id DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_user_participated_jams(
  uuid,
  integer,
  timestamptz,
  uuid
) TO authenticated;

-- ============================================================================
-- Reference data (instruments, music styles)
-- ============================================================================

INSERT INTO public.instruments (name, slug) VALUES
  ('Guitare', 'guitare'),
  ('Guitare basse', 'guitare-basse'),
  ('Batterie', 'batterie'),
  ('Piano', 'piano'),
  ('Clavier', 'clavier'),
  ('Chant', 'chant'),
  ('Violon', 'violon'),
  ('Alto', 'alto'),
  ('Violoncelle', 'violoncelle'),
  ('Contrebasse', 'contrebasse'),
  ('Saxophone', 'saxophone'),
  ('Trompette', 'trompette'),
  ('Trombone', 'trombone'),
  ('Flûte', 'flute'),
  ('Clarinette', 'clarinette'),
  ('Harmonica', 'harmonica'),
  ('Ukulélé', 'ukulele'),
  ('Banjo', 'banjo'),
  ('DJ / Platines', 'dj-platines'),
  ('MAO / Production', 'mao-production');

INSERT INTO public.music_styles (name, slug) VALUES
  ('Jazz', 'jazz'),
  ('Blues', 'blues'),
  ('Rock', 'rock'),
  ('Pop', 'pop'),
  ('Funk', 'funk'),
  ('Soul', 'soul'),
  ('R&B', 'rnb'),
  ('Hip-hop', 'hip-hop'),
  ('Reggae', 'reggae'),
  ('Metal', 'metal'),
  ('Punk', 'punk'),
  ('Folk', 'folk'),
  ('Country', 'country'),
  ('Classique', 'classique'),
  ('Électro', 'electro'),
  ('House', 'house'),
  ('Techno', 'techno'),
  ('World', 'world'),
  ('Latin', 'latin'),
  ('Fusion', 'fusion');

-- ============================================================================
-- Avatars storage bucket
-- ============================================================================

-- Avatars bucket (public read, owner write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY avatars_select_public
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY avatars_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY avatars_update_own
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY avatars_delete_own
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Notifications: types and tables
-- ============================================================================

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

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- Notifications: row level security
-- ============================================================================

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_starting_notification_log ENABLE ROW LEVEL SECURITY;

-- devices
CREATE POLICY devices_select_own
  ON public.devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY devices_insert_own
  ON public.devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY devices_update_own
  ON public.devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY devices_delete_own
  ON public.devices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- notification_preferences
CREATE POLICY notification_preferences_select_own
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY notification_preferences_insert_own
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notification_preferences_update_own
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- notifications
CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_delete_own
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- jam_starting_notification_log: service role only (no client policies)

-- ============================================================================
-- Notifications: functions and triggers
-- ============================================================================

-- Extract city from location_name (first segment before comma)
CREATE OR REPLACE FUNCTION public.extract_city(p_location_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT lower(trim(split_part(coalesce(p_location_name, ''), ',', 1)));
$$;

-- Check if current time is within quiet hours (handles overnight ranges)
CREATE OR REPLACE FUNCTION public.is_in_quiet_hours(
  p_start time,
  p_end time,
  p_now time DEFAULT (now() AT TIME ZONE 'UTC')::time
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_start IS NULL OR p_end IS NULL THEN false
    WHEN p_start < p_end THEN p_now >= p_start AND p_now < p_end
    ELSE p_now >= p_start OR p_now < p_end
  END;
$$;

-- Edge function credentials are read from Supabase Vault.
-- Secrets must be created manually (Dashboard or SQL Editor), never in migrations:
--   vault.create_secret('https://<project-ref>.supabase.co', 'project_url', '...');
--   vault.create_secret('<service-role-key>', 'service_role_key', '...');

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_vault_secret(p_name text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = vault
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = p_name
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.get_vault_secret(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_vault_secret(text) TO postgres, service_role;

-- Invoke edge function via pg_net (async, after transaction commit)
CREATE OR REPLACE FUNCTION public.invoke_notification_edge_function(
  p_function_name text,
  p_body jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, private
AS $$
DECLARE
  v_base_url text;
  v_service_role_key text;
  v_url text;
  v_request_id bigint;
BEGIN
  v_base_url := coalesce(
    private.get_vault_secret('project_url'),
    current_setting('app.settings.supabase_url', true)
  );
  v_service_role_key := coalesce(
    private.get_vault_secret('service_role_key'),
    current_setting('app.settings.service_role_key', true)
  );

  IF v_base_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE WARNING 'Notification edge function skipped: missing Vault secrets (project_url, service_role_key)';
    RETURN NULL;
  END IF;

  v_url := rtrim(v_base_url, '/') || '/functions/v1/' || p_function_name;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := p_body
  )
  INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_notification_edge_function(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_notification_edge_function(text, jsonb) TO postgres, service_role;

-- Friendship: friend request
CREATE OR REPLACE FUNCTION public.trigger_friend_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM public.invoke_notification_edge_function(
      'send-friend-request-notification',
      jsonb_build_object(
        'friendship_id', NEW.id,
        'requester_id', NEW.requester_id,
        'addressee_id', NEW.addressee_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER friendships_friend_request_notification
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_friend_request_notification();

-- Friendship: accepted
CREATE OR REPLACE FUNCTION public.trigger_friend_accepted_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    PERFORM public.invoke_notification_edge_function(
      'send-friend-accepted-notification',
      jsonb_build_object(
        'friendship_id', NEW.id,
        'requester_id', NEW.requester_id,
        'addressee_id', NEW.addressee_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER friendships_friend_accepted_notification
  AFTER UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_friend_accepted_notification();

-- New jam (pg_net runs after commit, so junction tables are populated)
CREATE OR REPLACE FUNCTION public.trigger_new_jam_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.invoke_notification_edge_function(
    'send-new-jam-notification',
    jsonb_build_object('jam_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER jams_new_jam_notification
  AFTER INSERT ON public.jams
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_jam_notification();

-- Jam updated
CREATE OR REPLACE FUNCTION public.trigger_jam_updated_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF
    OLD.title IS DISTINCT FROM NEW.title
    OR OLD.description IS DISTINCT FROM NEW.description
    OR OLD.starts_at IS DISTINCT FROM NEW.starts_at
    OR OLD.location_name IS DISTINCT FROM NEW.location_name
    OR OLD.latitude IS DISTINCT FROM NEW.latitude
    OR OLD.longitude IS DISTINCT FROM NEW.longitude
    OR OLD.skill_level IS DISTINCT FROM NEW.skill_level
    OR OLD.max_participants IS DISTINCT FROM NEW.max_participants
  THEN
    PERFORM public.invoke_notification_edge_function(
      'send-jam-updated-notification',
      jsonb_build_object('jam_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER jams_updated_notification
  AFTER UPDATE ON public.jams
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_jam_updated_notification();

-- Jam cancelled (on delete)
CREATE OR REPLACE FUNCTION public.trigger_jam_cancelled_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.invoke_notification_edge_function(
    'send-jam-cancelled-notification',
    jsonb_build_object(
      'jam_id', OLD.id,
      'title', OLD.title,
      'starts_at', OLD.starts_at,
      'creator_id', OLD.creator_id
    )
  );

  RETURN OLD;
END;
$$;

CREATE TRIGGER jams_cancelled_notification
  BEFORE DELETE ON public.jams
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_jam_cancelled_notification();

-- Find users eligible for new jam notifications (used by edge function via RPC)
CREATE OR REPLACE FUNCTION public.find_new_jam_notification_recipients(p_jam_id uuid)
RETURNS TABLE (
  user_id uuid,
  notification_type public.notification_type
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH jam_data AS (
    SELECT
      j.id,
      j.creator_id,
      j.location,
      j.location_name,
      public.extract_city(j.location_name) AS jam_city,
      coalesce(
        array_agg(DISTINCT js.music_style_id) FILTER (WHERE js.music_style_id IS NOT NULL),
        '{}'::uuid[]
      ) AS style_ids,
      coalesce(
        array_agg(DISTINCT ji.instrument_id) FILTER (WHERE ji.instrument_id IS NOT NULL),
        '{}'::uuid[]
      ) AS instrument_ids
    FROM public.jams j
    LEFT JOIN public.jam_styles js ON js.jam_id = j.id
    LEFT JOIN public.jam_instruments ji ON ji.jam_id = j.id
    WHERE j.id = p_jam_id
    GROUP BY j.id, j.creator_id, j.location, j.location_name
  ),
  candidates AS (
    SELECT
      p.id AS user_id,
      np.new_jams_city,
      np.new_jams_radius,
      np.new_matching_jams,
      np.radius_km,
      np.quiet_hours_start,
      np.quiet_hours_end,
      p.location,
      public.extract_city(p.location_name) AS user_city,
      coalesce(
        array_agg(DISTINCT ums.music_style_id) FILTER (WHERE ums.music_style_id IS NOT NULL),
        '{}'::uuid[]
      ) AS user_style_ids,
      coalesce(
        array_agg(DISTINCT ui.instrument_id) FILTER (WHERE ui.instrument_id IS NOT NULL),
        '{}'::uuid[]
      ) AS user_instrument_ids
    FROM public.profiles p
    INNER JOIN public.notification_preferences np ON np.user_id = p.id
    LEFT JOIN public.user_music_styles ums ON ums.user_id = p.id
    LEFT JOIN public.user_instruments ui ON ui.user_id = p.id
    CROSS JOIN jam_data jd
    WHERE p.id <> jd.creator_id
      AND p.location IS NOT NULL
      AND NOT public.is_in_quiet_hours(np.quiet_hours_start, np.quiet_hours_end)
    GROUP BY
      p.id,
      np.new_jams_city,
      np.new_jams_radius,
      np.new_matching_jams,
      np.radius_km,
      np.quiet_hours_start,
      np.quiet_hours_end,
      p.location,
      p.location_name
  ),
  classified AS (
    SELECT
      c.user_id,
      CASE
        WHEN
          c.new_matching_jams
          AND (
            (cardinality(jd.style_ids) > 0 AND c.user_style_ids && jd.style_ids)
            OR (cardinality(jd.instrument_ids) > 0 AND c.user_instrument_ids && jd.instrument_ids)
          )
          THEN 'NEW_JAM_MATCH'::public.notification_type
        WHEN
          c.new_jams_radius
          AND extensions.st_dwithin(
            c.location,
            jd.location,
            (c.radius_km * 1000)::double precision
          )
          THEN 'NEW_JAM_RADIUS'::public.notification_type
        WHEN
          c.new_jams_city
          AND c.user_city <> ''
          AND c.user_city = jd.jam_city
          THEN 'NEW_JAM_CITY'::public.notification_type
        ELSE NULL
      END AS notification_type
    FROM candidates c
    CROSS JOIN jam_data jd
  )
  SELECT DISTINCT ON (classified.user_id)
    classified.user_id,
    classified.notification_type
  FROM classified
  WHERE classified.notification_type IS NOT NULL
  ORDER BY
    classified.user_id,
    CASE classified.notification_type
      WHEN 'NEW_JAM_MATCH' THEN 1
      WHEN 'NEW_JAM_RADIUS' THEN 2
      WHEN 'NEW_JAM_CITY' THEN 3
      ELSE 4
    END;
$$;

REVOKE ALL ON FUNCTION public.find_new_jam_notification_recipients(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_new_jam_notification_recipients(uuid) TO service_role;

-- Find jams starting soon (for cron edge function)
CREATE OR REPLACE FUNCTION public.find_jams_starting_soon(p_minutes_before integer)
RETURNS TABLE (
  jam_id uuid,
  title text,
  starts_at timestamptz,
  creator_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    j.id,
    j.title,
    j.starts_at,
    j.creator_id
  FROM public.jams j
  WHERE j.starts_at > now()
    AND j.starts_at <= now() + make_interval(mins => p_minutes_before)
    AND j.starts_at > now() + make_interval(mins => p_minutes_before - 5);
$$;

REVOKE ALL ON FUNCTION public.find_jams_starting_soon(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_jams_starting_soon(integer) TO service_role;

-- Paginated notifications list
CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS SETOF public.notifications
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT n.*
  FROM public.notifications n
  WHERE n.user_id = p_user_id
    AND (
      p_cursor_id IS NULL
      OR (n.created_at, n.id) < (p_cursor_created_at, p_cursor_id)
    )
  ORDER BY n.created_at DESC, n.id DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_user_notifications(uuid, integer, timestamptz, uuid) TO authenticated;

-- Unread count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.notifications
  WHERE user_id = p_user_id
    AND is_read = false;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_notifications_count(uuid) TO authenticated;

-- ============================================================================
-- Scheduled jobs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Every 5 minutes, ask the edge function to notify participants of jams starting soon.
SELECT cron.schedule(
  'jam-starting-soon',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := rtrim(private.get_vault_secret('project_url'), '/') || '/functions/v1/send-jam-starting-soon-notification',
    headers := '{}'::jsonb,
    timeout_milliseconds := 1000
  );
  $cron$
);
