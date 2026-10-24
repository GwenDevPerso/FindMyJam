-- Recurring jams.
--
-- A series (`jam_series`) is the template of a jam that repeats every week, every 2 weeks or every month on the
-- same weekday position (e.g. 2nd Tuesday). Its dates are real `jams` rows (`series_id`, `occurrence_date`), so
-- joining, notifications and search work per date as for a one-off jam. They are generated over a rolling
-- window (today + 60 days, in the series' time zone): `create_jam_series` fills it, and the daily
-- `jam-series-rollover` cron job keeps it topped up through `extend_jam_series`.
--
-- Generation only ever adds dates after `jam_series.generated_until`, so a date the creator deleted is never
-- recreated, and the unique index on (series_id, occurrence_date) makes it idempotent.

-- ============================================================================
-- Schema
-- ============================================================================

CREATE TYPE public.jam_recurrence AS ENUM (
  'weekly',
  'biweekly',
  'monthly_weekday'
);

CREATE TABLE public.jam_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  -- Schedule: dates repeat from anchor_date (the first date); local_time is read in timezone (IANA name), so the
  -- local time of day stays the same across DST changes.
  frequency public.jam_recurrence NOT NULL,
  anchor_date date NOT NULL,
  local_time time NOT NULL,
  timezone text NOT NULL,
  -- Template copied to every generated date.
  title text NOT NULL,
  description text,
  location_name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  skill_level public.skill_level NOT NULL DEFAULT 'all_levels',
  max_participants integer NOT NULL DEFAULT 10,
  instrument_ids uuid[] NOT NULL DEFAULT '{}',
  style_ids uuid[] NOT NULL DEFAULT '{}',
  -- Last date already generated; generation resumes the day after.
  generated_until date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jam_series_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT jam_series_description_length CHECK (
    description IS NULL OR char_length(description) <= 2000
  ),
  CONSTRAINT jam_series_location_name_not_empty CHECK (char_length(trim(location_name)) > 0),
  CONSTRAINT jam_series_latitude_range CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT jam_series_longitude_range CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT jam_series_max_participants_positive CHECK (max_participants >= 2),
  CONSTRAINT jam_series_timezone_not_empty CHECK (char_length(trim(timezone)) > 0)
);

CREATE INDEX jam_series_creator_id_idx ON public.jam_series (creator_id);

CREATE TRIGGER jam_series_set_updated_at
  BEFORE UPDATE ON public.jam_series
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Dates of a series. Deleting a series keeps its past dates as one-off jams (delete_jam_series removes the
-- upcoming ones first).
ALTER TABLE public.jams
  ADD COLUMN series_id uuid REFERENCES public.jam_series (id) ON DELETE SET NULL,
  ADD COLUMN occurrence_date date;

-- One row per date of a series; NULLs (one-off jams) are distinct. Also serves lookups by series_id.
CREATE UNIQUE INDEX jams_series_occurrence_unique_idx ON public.jams (series_id, occurrence_date);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.jam_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY jam_series_select_authenticated
  ON public.jam_series
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY jam_series_insert_own
  ON public.jam_series
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY jam_series_update_creator
  ON public.jam_series
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY jam_series_delete_creator
  ON public.jam_series
  FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- ============================================================================
-- Date generation
-- ============================================================================

-- Dates of a series between p_from and p_until (inclusive), never before the anchor.
--   weekly / biweekly: every 7 / 14 days from the anchor.
--   monthly_weekday:   the same ISO weekday and the same position in the month as the anchor (2nd Tuesday…);
--                      a 5th position means "last", so months with only four of that weekday still get a date.
-- The client (`src/utils/recurrence.ts`) describes the series with the same rule.
CREATE OR REPLACE FUNCTION private.next_occurrence_dates(
  p_frequency public.jam_recurrence,
  p_anchor_date date,
  p_from date,
  p_until date
)
RETURNS SETOF date
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  WITH bounds AS (
    SELECT GREATEST(p_from, p_anchor_date) AS from_date
  ),
  weekly AS (
    SELECT d::date AS occurrence_date
    FROM generate_series(
      p_anchor_date::timestamp,
      p_until::timestamp,
      CASE p_frequency WHEN 'biweekly' THEN interval '14 days' ELSE interval '7 days' END
    ) AS d
    WHERE p_frequency IN ('weekly', 'biweekly')
  ),
  anchor AS (
    SELECT
      extract(isodow FROM p_anchor_date)::integer AS weekday,
      ((extract(day FROM p_anchor_date)::integer - 1) / 7) + 1 AS position
  ),
  months AS (
    SELECT m::date AS month_start
    FROM generate_series(
      date_trunc('month', p_anchor_date::timestamp),
      date_trunc('month', p_until::timestamp),
      interval '1 month'
    ) AS m
    WHERE p_frequency = 'monthly_weekday'
  ),
  monthly AS (
    SELECT
      CASE
        WHEN anchor.position <= 4 THEN
          -- First matching weekday of the month, then (position - 1) weeks later.
          months.month_start
            + ((anchor.weekday - extract(isodow FROM months.month_start)::integer + 7) % 7)
            + (anchor.position - 1) * 7
        ELSE
          -- Last matching weekday of the month, counted back from its last day.
          (months.month_start + interval '1 month' - interval '1 day')::date
            - ((extract(isodow FROM (months.month_start + interval '1 month' - interval '1 day'))::integer
                - anchor.weekday + 7) % 7)
      END AS occurrence_date
    FROM months
    CROSS JOIN anchor
  )
  SELECT dates.occurrence_date
  FROM (
    SELECT occurrence_date FROM weekly
    UNION ALL
    SELECT occurrence_date FROM monthly
  ) AS dates
  CROSS JOIN bounds
  WHERE dates.occurrence_date >= bounds.from_date
    AND dates.occurrence_date <= p_until
  ORDER BY dates.occurrence_date;
$$;

REVOKE ALL ON FUNCTION private.next_occurrence_dates(public.jam_recurrence, date, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.next_occurrence_dates(public.jam_recurrence, date, date, date)
  TO authenticated, service_role;

-- Inserts the dates of one series after generated_until, up to today + 60 days in the series' time zone (or up
-- to the anchor, if it is further away, so the first date always exists), with the template's instruments and
-- styles, then moves generated_until forward. Returns the number of dates inserted.
-- Runs as its owner: the jam rows belong to the series' creator, whoever triggers the generation (the creator
-- through create_jam_series, the cron job through extend_jam_series). `private` is not exposed through the API;
-- a signed-in caller may still only generate the dates of their own series.
CREATE OR REPLACE FUNCTION private.generate_jam_series_occurrences(p_series_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_series public.jam_series%ROWTYPE;
  v_until date;
  v_inserted integer;
BEGIN
  SELECT *
  INTO v_series
  FROM public.jam_series AS s
  WHERE s.id = p_series_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> v_series.creator_id THEN
    RAISE EXCEPTION 'Only the jam creator can perform this action' USING ERRCODE = '42501';
  END IF;

  v_until := GREATEST((now() AT TIME ZONE v_series.timezone)::date + 60, v_series.anchor_date);

  IF v_series.generated_until >= v_until THEN
    RETURN 0;
  END IF;

  WITH inserted AS (
    INSERT INTO public.jams (
      creator_id,
      title,
      description,
      starts_at,
      location_name,
      latitude,
      longitude,
      skill_level,
      max_participants,
      series_id,
      occurrence_date
    )
    SELECT
      v_series.creator_id,
      v_series.title,
      v_series.description,
      (dates.occurrence_date + v_series.local_time) AT TIME ZONE v_series.timezone,
      v_series.location_name,
      v_series.latitude,
      v_series.longitude,
      v_series.skill_level,
      v_series.max_participants,
      v_series.id,
      dates.occurrence_date
    FROM private.next_occurrence_dates(
      v_series.frequency,
      v_series.anchor_date,
      v_series.generated_until + 1,
      v_until
    ) AS dates (occurrence_date)
    ON CONFLICT (series_id, occurrence_date) DO NOTHING
    RETURNING id
  ),
  inserted_instruments AS (
    -- Joined with the catalogue so that an instrument removed since the series was created is skipped.
    INSERT INTO public.jam_instruments (jam_id, instrument_id)
    SELECT inserted.id, i.id
    FROM inserted
    CROSS JOIN unnest(v_series.instrument_ids) AS wanted (instrument_id)
    INNER JOIN public.instruments AS i ON i.id = wanted.instrument_id
    ON CONFLICT DO NOTHING
  ),
  inserted_styles AS (
    INSERT INTO public.jam_styles (jam_id, music_style_id)
    SELECT inserted.id, ms.id
    FROM inserted
    CROSS JOIN unnest(v_series.style_ids) AS wanted (music_style_id)
    INNER JOIN public.music_styles AS ms ON ms.id = wanted.music_style_id
    ON CONFLICT DO NOTHING
  )
  SELECT count(*)::integer
  INTO v_inserted
  FROM inserted;

  UPDATE public.jam_series AS s
  SET generated_until = v_until
  WHERE s.id = p_series_id;

  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION private.generate_jam_series_occurrences(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.generate_jam_series_occurrences(uuid) TO authenticated, service_role;

-- create_jam_series runs as the caller and calls the helpers above. Only the functions granted above are
-- executable: private.get_vault_secret stays restricted to postgres and service_role.
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Tops up the window of one series, or of every series when p_series_id is NULL (daily cron job). Idempotent.
CREATE OR REPLACE FUNCTION public.extend_jam_series(p_series_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_series_id uuid;
  v_total integer := 0;
BEGIN
  FOR v_series_id IN
    SELECT s.id
    FROM public.jam_series AS s
    WHERE p_series_id IS NULL OR s.id = p_series_id
    ORDER BY s.id
  LOOP
    v_total := v_total + private.generate_jam_series_occurrences(v_series_id);
  END LOOP;

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.extend_jam_series(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.extend_jam_series(uuid) TO postgres, service_role;

-- ============================================================================
-- RPCs for the creator
-- ============================================================================
-- They run as the caller (SECURITY INVOKER), so the RLS policies of jam_series, jams, jam_instruments and
-- jam_styles apply on top of their own creator check. Each one runs in a single transaction: a series and its
-- dates are written together or not at all.

-- Creates a series owned by the caller and its first dates. Returns the series and its first date.
CREATE OR REPLACE FUNCTION public.create_jam_series(
  p_frequency public.jam_recurrence,
  p_anchor_date date,
  p_local_time time,
  p_timezone text,
  p_title text,
  p_description text,
  p_location_name text,
  p_latitude double precision,
  p_longitude double precision,
  p_skill_level public.skill_level,
  p_max_participants integer,
  p_instrument_ids uuid[],
  p_style_ids uuid[]
)
RETURNS TABLE (
  series_id uuid,
  first_jam_id uuid
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_series_id uuid;
  v_first_jam_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names AS tz WHERE tz.name = p_timezone) THEN
    RAISE EXCEPTION 'Unknown time zone: %', p_timezone USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.jam_series (
    creator_id,
    frequency,
    anchor_date,
    local_time,
    timezone,
    title,
    description,
    location_name,
    latitude,
    longitude,
    skill_level,
    max_participants,
    instrument_ids,
    style_ids,
    generated_until
  )
  VALUES (
    v_user_id,
    p_frequency,
    p_anchor_date,
    p_local_time,
    p_timezone,
    p_title,
    p_description,
    p_location_name,
    p_latitude,
    p_longitude,
    p_skill_level,
    p_max_participants,
    coalesce(p_instrument_ids, '{}'),
    coalesce(p_style_ids, '{}'),
    p_anchor_date - 1
  )
  RETURNING id INTO v_series_id;

  PERFORM private.generate_jam_series_occurrences(v_series_id);

  SELECT j.id
  INTO v_first_jam_id
  FROM public.jams AS j
  WHERE j.series_id = v_series_id
  ORDER BY j.occurrence_date
  LIMIT 1;

  RETURN QUERY SELECT v_series_id, v_first_jam_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_jam_series(
  public.jam_recurrence,
  date,
  time,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  public.skill_level,
  integer,
  uuid[],
  uuid[]
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_jam_series(
  public.jam_recurrence,
  date,
  time,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  public.skill_level,
  integer,
  uuid[],
  uuid[]
) TO authenticated;

-- Applies a new template to the series and to its upcoming dates (starts_at >= now()), instruments and styles
-- included. A new time of day is applied to each date's own occurrence_date, in the series' time zone. The
-- frequency and the day cannot change: to move a series, delete it and create a new one. Past dates keep
-- their values. Each updated date fires jams_updated_notification for its own participants.
CREATE OR REPLACE FUNCTION public.update_jam_series(
  p_series_id uuid,
  p_local_time time,
  p_title text,
  p_description text,
  p_location_name text,
  p_latitude double precision,
  p_longitude double precision,
  p_skill_level public.skill_level,
  p_max_participants integer,
  p_instrument_ids uuid[],
  p_style_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_series public.jam_series%ROWTYPE;
  v_jam_ids uuid[];
BEGIN
  SELECT *
  INTO v_series
  FROM public.jam_series AS s
  WHERE s.id = p_series_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jam series not found' USING ERRCODE = 'P0002';
  END IF;

  IF auth.uid() IS NULL OR v_series.creator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the jam creator can perform this action' USING ERRCODE = '42501';
  END IF;

  UPDATE public.jam_series AS s
  SET
    local_time = p_local_time,
    title = p_title,
    description = p_description,
    location_name = p_location_name,
    latitude = p_latitude,
    longitude = p_longitude,
    skill_level = p_skill_level,
    max_participants = p_max_participants,
    instrument_ids = coalesce(p_instrument_ids, '{}'),
    style_ids = coalesce(p_style_ids, '{}')
  WHERE s.id = p_series_id;

  -- Collected after the series row is locked by the update above (so the cron job cannot add a date with the old
  -- template meanwhile) and before the dates change: a new time of day may move a date of today before now().
  SELECT coalesce(array_agg(j.id), '{}')
  INTO v_jam_ids
  FROM public.jams AS j
  WHERE j.series_id = p_series_id
    AND j.starts_at >= now();

  UPDATE public.jams AS j
  SET
    title = p_title,
    description = p_description,
    starts_at = (j.occurrence_date + p_local_time) AT TIME ZONE v_series.timezone,
    location_name = p_location_name,
    latitude = p_latitude,
    longitude = p_longitude,
    skill_level = p_skill_level,
    max_participants = p_max_participants
  WHERE j.id = ANY (v_jam_ids);

  DELETE FROM public.jam_instruments AS ji
  WHERE ji.jam_id = ANY (v_jam_ids);

  DELETE FROM public.jam_styles AS js
  WHERE js.jam_id = ANY (v_jam_ids);

  INSERT INTO public.jam_instruments (jam_id, instrument_id)
  SELECT jam.id, i.id
  FROM unnest(v_jam_ids) AS jam (id)
  CROSS JOIN unnest(coalesce(p_instrument_ids, '{}')) AS wanted (instrument_id)
  INNER JOIN public.instruments AS i ON i.id = wanted.instrument_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.jam_styles (jam_id, music_style_id)
  SELECT jam.id, ms.id
  FROM unnest(v_jam_ids) AS jam (id)
  CROSS JOIN unnest(coalesce(p_style_ids, '{}')) AS wanted (music_style_id)
  INNER JOIN public.music_styles AS ms ON ms.id = wanted.music_style_id
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.update_jam_series(
  uuid,
  time,
  text,
  text,
  text,
  double precision,
  double precision,
  public.skill_level,
  integer,
  uuid[],
  uuid[]
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_jam_series(
  uuid,
  time,
  text,
  text,
  text,
  double precision,
  double precision,
  public.skill_level,
  integer,
  uuid[],
  uuid[]
) TO authenticated;

-- Deletes the upcoming dates of the series (each one notifies its participants through
-- jams_cancelled_notification), then the series. Past dates stay as one-off jams (series_id set to NULL).
CREATE OR REPLACE FUNCTION public.delete_jam_series(p_series_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_creator_id uuid;
BEGIN
  SELECT s.creator_id
  INTO v_creator_id
  FROM public.jam_series AS s
  WHERE s.id = p_series_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jam series not found' USING ERRCODE = 'P0002';
  END IF;

  IF auth.uid() IS NULL OR v_creator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the jam creator can perform this action' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.jams AS j
  WHERE j.series_id = p_series_id
    AND j.starts_at >= now();

  DELETE FROM public.jam_series AS s
  WHERE s.id = p_series_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_jam_series(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_jam_series(uuid) TO authenticated;

-- ============================================================================
-- Notifications
-- ============================================================================

-- New jam: only the first date of a series announces it; otherwise the daily cron job would announce the series
-- again every week. Same signature and settings as the baseline; the trigger keeps pointing at it.
CREATE OR REPLACE FUNCTION public.trigger_new_jam_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.series_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.jam_series AS s
    WHERE s.id = NEW.series_id
      AND s.anchor_date IS DISTINCT FROM NEW.occurrence_date
  ) THEN
    RETURN NEW;
  END IF;

  PERFORM public.invoke_notification_edge_function(
    'send-new-jam-notification',
    jsonb_build_object('jam_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

-- ============================================================================
-- Search
-- ============================================================================

-- search_jams: same as the baseline, plus series_id and occurrence_date. The return type changes, so the
-- function is dropped and recreated (CREATE OR REPLACE cannot change it).
-- get_user_created_jams / get_user_participated_jams return public.jams rows and pick the new columns up
-- without being recreated.
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

-- ============================================================================
-- Scheduled job
-- ============================================================================

-- Every day at 03:00 UTC, top up the 60-day window of every series.
SELECT cron.schedule(
  'jam-series-rollover',
  '0 3 * * *',
  $cron$ SELECT public.extend_jam_series(); $cron$
);
