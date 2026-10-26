-- Jam waitlist.
--
-- A user can wait for a spot on a full jam. When a participant leaves (or the creator removes one), the first
-- person waiting is moved into the freed spot and notified by the `send-waitlist-promoted-notification` Edge
-- Function. Deploy that function before applying this migration (see "Migrations" in DATABASE.md).
--
-- `WAITLIST_PROMOTED` is not used in this file: a new enum value cannot be used in the transaction that adds it.
-- Only the Edge Function inserts it.

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'WAITLIST_PROMOTED';

-- ============================================================================
-- Table
-- ============================================================================

CREATE TABLE public.jam_waitlist (
  jam_id uuid NOT NULL REFERENCES public.jams (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  -- Order of arrival, set by jam_waitlist_before_insert. Leaves gaps when people leave: the client shows a rank.
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (jam_id, user_id),
  CONSTRAINT jam_waitlist_jam_position_key UNIQUE (jam_id, position)
);

CREATE INDEX jam_waitlist_user_id_idx ON public.jam_waitlist (user_id);

ALTER TABLE public.jam_waitlist ENABLE ROW LEVEL SECURITY;

-- Same visibility as jam_participants.
CREATE POLICY jam_waitlist_select_authenticated
  ON public.jam_waitlist
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY jam_waitlist_insert_own
  ON public.jam_waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY jam_waitlist_delete_own
  ON public.jam_waitlist
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- Joining the waitlist
-- ============================================================================

-- Only an upcoming, full jam, and not for its creator or a participant. The position is assigned here (any value
-- sent by the client is replaced) under a per-jam lock, shared with the promotion below.
CREATE OR REPLACE FUNCTION public.jam_waitlist_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jam public.jams%ROWTYPE;
  v_participant_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.jam_id::text));

  SELECT * INTO v_jam FROM public.jams WHERE id = NEW.jam_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jam % does not exist', NEW.jam_id;
  END IF;

  IF v_jam.starts_at <= now() THEN
    RAISE EXCEPTION 'Jam % has already started', NEW.jam_id;
  END IF;

  IF v_jam.creator_id = NEW.user_id THEN
    RAISE EXCEPTION 'Jam creator cannot join the waitlist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.jam_participants WHERE jam_id = NEW.jam_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'User % already participates in jam %', NEW.user_id, NEW.jam_id;
  END IF;

  SELECT count(*) INTO v_participant_count FROM public.jam_participants WHERE jam_id = NEW.jam_id;

  IF v_participant_count < v_jam.max_participants THEN
    RAISE EXCEPTION 'Jam % is not full', NEW.jam_id;
  END IF;

  SELECT coalesce(max(position), 0) + 1 INTO NEW.position FROM public.jam_waitlist WHERE jam_id = NEW.jam_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER jam_waitlist_before_insert
  BEFORE INSERT ON public.jam_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.jam_waitlist_before_insert();

-- ============================================================================
-- Promotion
-- ============================================================================

-- After a participant leaves or is removed: move the first person waiting into the freed spot, then notify them.
-- Skipped when the jam is gone (the rows are cascading from a jam delete), has started, or is still full.
CREATE OR REPLACE FUNCTION public.promote_jam_waitlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jam public.jams%ROWTYPE;
  v_participant_count integer;
  v_next_user_id uuid;
BEGIN
  SELECT * INTO v_jam FROM public.jams WHERE id = OLD.jam_id;

  IF NOT FOUND OR v_jam.starts_at <= now() THEN
    RETURN OLD;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(OLD.jam_id::text));

  SELECT count(*) INTO v_participant_count FROM public.jam_participants WHERE jam_id = OLD.jam_id;

  IF v_participant_count >= v_jam.max_participants THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.jam_waitlist
  WHERE (jam_id, user_id) = (
    SELECT w.jam_id, w.user_id
    FROM public.jam_waitlist w
    WHERE w.jam_id = OLD.jam_id
    ORDER BY w.position
    LIMIT 1
  )
  RETURNING user_id INTO v_next_user_id;

  IF v_next_user_id IS NULL THEN
    RETURN OLD;
  END IF;

  INSERT INTO public.jam_participants (jam_id, user_id) VALUES (OLD.jam_id, v_next_user_id);

  PERFORM public.invoke_notification_edge_function(
    'send-waitlist-promoted-notification',
    jsonb_build_object('jam_id', OLD.jam_id, 'user_id', v_next_user_id)
  );

  RETURN OLD;
END;
$$;

CREATE TRIGGER jam_participants_promote_waitlist
  AFTER DELETE ON public.jam_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_jam_waitlist();

-- A user who joins directly (a spot was free) leaves the waitlist of that jam.
CREATE OR REPLACE FUNCTION public.remove_joined_user_from_waitlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.jam_waitlist WHERE jam_id = NEW.jam_id AND user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER jam_participants_remove_from_waitlist
  AFTER INSERT ON public.jam_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.remove_joined_user_from_waitlist();

-- ============================================================================
-- Grants
-- ============================================================================

-- Trigger functions: nobody calls them directly (see 20261024140000_lock_down_function_grants.sql).
REVOKE EXECUTE ON FUNCTION public.jam_waitlist_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_jam_waitlist() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remove_joined_user_from_waitlist() FROM PUBLIC, anon, authenticated;
