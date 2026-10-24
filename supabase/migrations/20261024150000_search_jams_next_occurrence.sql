-- search_jams: new p_next_occurrence_only parameter, so the map shows only the next date of a recurring jam instead of
-- every generated date. The signature changes, so the function is dropped and recreated.

DROP FUNCTION public.search_jams(
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
);

CREATE FUNCTION public.search_jams(
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
  p_cursor_id uuid DEFAULT NULL,
  p_next_occurrence_only boolean DEFAULT false
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
  series_id uuid,
  occurrence_date date,
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
      j.series_id,
      j.occurrence_date,
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
  ),
  -- With p_next_occurrence_only, one row per series: its earliest date that passed the filters. A one-off jam is its
  -- own group (series_id is null). Done before the cursor so every page sees the same rows.
  candidates AS (
    SELECT f.*
    FROM filtered f
    WHERE NOT p_next_occurrence_only
    UNION ALL
    (
      SELECT DISTINCT ON (COALESCE(f.series_id, f.id)) f.*
      FROM filtered f
      WHERE p_next_occurrence_only
      ORDER BY COALESCE(f.series_id, f.id), f.starts_at ASC, f.id ASC
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
    f.series_id,
    f.occurrence_date,
    f.created_at,
    f.updated_at
  FROM candidates f
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

-- Supabase's default privileges would grant the new function to anon (see 20261024140000_lock_down_function_grants.sql).
REVOKE EXECUTE ON FUNCTION public.search_jams(
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
  uuid,
  boolean
) FROM PUBLIC, anon;

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
  uuid,
  boolean
) TO authenticated;
