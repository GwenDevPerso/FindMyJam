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
