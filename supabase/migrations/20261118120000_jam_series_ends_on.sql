-- End date of a recurring jam.
--
-- `jam_series.ends_on` is the last day a series may have a date on (inclusive, in the series' time zone); NULL means
-- it never ends. Generation stops at it. Moving it earlier through update_jam_series deletes the upcoming dates after
-- it (each one notifies its participants through jams_cancelled_notification); moving it later or clearing it
-- generates the missing dates right away instead of waiting for the daily cron job.

-- ============================================================================
-- Schema
-- ============================================================================

ALTER TABLE public.jam_series
  ADD COLUMN ends_on date,
  ADD CONSTRAINT jam_series_ends_on_after_anchor CHECK (ends_on IS NULL OR ends_on >= anchor_date);

-- ============================================================================
-- Date generation
-- ============================================================================

-- Same as in 20261024120000_recurring_jams.sql, except that the window never goes past ends_on (LEAST ignores NULL).
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

  v_until := LEAST(
    GREATEST((now() AT TIME ZONE v_series.timezone)::date + 60, v_series.anchor_date),
    v_series.ends_on
  );

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

-- ============================================================================
-- RPCs for the creator
-- ============================================================================
-- Both gain a trailing p_ends_on; the signature changes, so the old functions are dropped and recreated.

DROP FUNCTION public.create_jam_series(
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
);

-- Creates a series owned by the caller and its first dates. Returns the series and its first date.
CREATE FUNCTION public.create_jam_series(
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
  p_style_ids uuid[],
  p_ends_on date
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
    ends_on,
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
    p_ends_on,
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
  uuid[],
  date
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
  uuid[],
  date
) TO authenticated;

DROP FUNCTION public.update_jam_series(
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
);

-- Applies a new template to the series and to its upcoming dates (starts_at >= now()), instruments and styles
-- included, as in 20261024120000_recurring_jams.sql. The end date also changes: upcoming dates after a new
-- p_ends_on are deleted first (each one fires jams_cancelled_notification), and the dates missing up to a later
-- (or cleared) end date are generated with the new template. Past dates keep their values.
CREATE FUNCTION public.update_jam_series(
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
  p_style_ids uuid[],
  p_ends_on date
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

  -- generated_until is pulled back to the new end so that a later extension generates the dates after it again.
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
    style_ids = coalesce(p_style_ids, '{}'),
    ends_on = p_ends_on,
    generated_until = LEAST(s.generated_until, p_ends_on)
  WHERE s.id = p_series_id;

  DELETE FROM public.jams AS j
  WHERE j.series_id = p_series_id
    AND j.starts_at >= now()
    AND j.occurrence_date > p_ends_on;

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

  PERFORM private.generate_jam_series_occurrences(p_series_id);
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
  uuid[],
  date
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
  uuid[],
  date
) TO authenticated;
