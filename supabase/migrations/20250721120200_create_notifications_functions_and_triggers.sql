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

-- Invoke edge function via pg_net (async, after transaction commit)
CREATE OR REPLACE FUNCTION public.invoke_notification_edge_function(
  p_function_name text,
  p_body jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_base_url text;
  v_service_role_key text;
  v_url text;
  v_request_id bigint;
BEGIN
  v_base_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    current_setting('supabase.url', true)
  );
  v_service_role_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    current_setting('supabase.service_role_key', true)
  );

  IF v_base_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE WARNING 'Notification edge function skipped: missing app.settings.supabase_url or service_role_key';
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
