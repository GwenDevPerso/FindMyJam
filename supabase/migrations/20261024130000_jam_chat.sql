-- Participant chat.
--
-- Every jam has a chat room, open to its creator and its participants:
--   * a date of a series talks in the room of the series (`jam_messages.series_id`), shared by the creator of the
--     series and the participants of any of its dates;
--   * a one-off jam has its own room (`jam_messages.jam_id`).
-- Messages are live through Realtime (postgres_changes applies the RLS below) and each new message sends a push
-- to the other members of the room through the `send-chat-message-notification` Edge Function. That function
-- only pushes: it stores no `notifications` row, so the inbox does not fill up with chat.

-- ============================================================================
-- Notification type and preference
-- ============================================================================

-- Push data type of a chat message. Never stored in `notifications`; declared so that the types stay in step.
-- A new enum value cannot be used in the transaction that adds it: nothing below references it.
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'CHAT_MESSAGE';

ALTER TABLE public.notification_preferences
  ADD COLUMN chat_messages boolean NOT NULL DEFAULT true;

-- ============================================================================
-- Schema
-- ============================================================================

CREATE TABLE public.jam_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Room: exactly one of jam_id (one-off jam) / series_id (series).
  jam_id uuid REFERENCES public.jams (id) ON DELETE CASCADE,
  series_id uuid REFERENCES public.jam_series (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jam_messages_one_room CHECK (num_nonnulls(jam_id, series_id) = 1),
  CONSTRAINT jam_messages_body_length CHECK (
    char_length(btrim(body, E' \t\r\n')) BETWEEN 1 AND 2000
  )
);

-- Keyset pagination of a room, newest first (get_jam_messages).
CREATE INDEX jam_messages_series_created_at_idx
  ON public.jam_messages (series_id, created_at DESC, id DESC)
  WHERE series_id IS NOT NULL;

CREATE INDEX jam_messages_jam_created_at_idx
  ON public.jam_messages (jam_id, created_at DESC, id DESC)
  WHERE jam_id IS NOT NULL;

CREATE INDEX jam_messages_sender_id_idx ON public.jam_messages (sender_id);

-- The server clock orders a room: a client cannot backdate or postdate a message.
CREATE OR REPLACE FUNCTION public.set_jam_message_created_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER jam_messages_set_created_at
  BEFORE INSERT ON public.jam_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_jam_message_created_at();

-- ============================================================================
-- Access
-- ============================================================================

-- Whether p_user_id may read and write in a room (exactly one of p_jam_id / p_series_id):
--   * one-off jam room: the jam's creator or a participant. A date of a series has no room of its own, it uses
--     the series' room, so a jam room is only valid for a jam without series_id;
--   * series room: the series' creator, or a participant of any of its dates.
-- SECURITY DEFINER so that RLS policies can call it whatever the caller may read; it only answers yes or no about
-- data (creators, participants) that any authenticated user can already read.
CREATE OR REPLACE FUNCTION public.can_access_jam_chat(p_jam_id uuid, p_series_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_user_id IS NULL OR num_nonnulls(p_jam_id, p_series_id) <> 1 THEN false
    WHEN p_jam_id IS NOT NULL THEN
      EXISTS (SELECT 1 FROM public.jams j WHERE j.id = p_jam_id AND j.series_id IS NULL)
      AND (public.is_jam_creator(p_jam_id, p_user_id) OR public.is_jam_participant(p_jam_id, p_user_id))
    ELSE
      EXISTS (SELECT 1 FROM public.jam_series s WHERE s.id = p_series_id AND s.creator_id = p_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.jams j
        INNER JOIN public.jam_participants jp ON jp.jam_id = j.id
        WHERE j.series_id = p_series_id
          AND jp.user_id = p_user_id
      )
  END;
$$;

REVOKE ALL ON FUNCTION public.can_access_jam_chat(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_jam_chat(uuid, uuid, uuid) TO authenticated, service_role;

ALTER TABLE public.jam_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY jam_messages_select_member
  ON public.jam_messages
  FOR SELECT
  TO authenticated
  USING (public.can_access_jam_chat(jam_id, series_id, (SELECT auth.uid())));

CREATE POLICY jam_messages_insert_member
  ON public.jam_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND public.can_access_jam_chat(jam_id, series_id, (SELECT auth.uid()))
  );

-- No UPDATE policy: messages are not edited.
CREATE POLICY jam_messages_delete_own
  ON public.jam_messages
  FOR DELETE
  TO authenticated
  USING (sender_id = (SELECT auth.uid()));

-- ============================================================================
-- Paginated messages of a room
-- ============================================================================

-- Messages of a room (exactly one of p_jam_id / p_series_id), newest first, with the sender's public profile.
-- Keyset on (created_at, id) like get_user_notifications; the limit is clamped to 1-100. SECURITY INVOKER: the
-- RLS policies above decide what the caller sees, so a non-member gets an empty page.
CREATE OR REPLACE FUNCTION public.get_jam_messages(
  p_jam_id uuid,
  p_series_id uuid,
  p_limit integer DEFAULT 30,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  jam_id uuid,
  series_id uuid,
  sender_id uuid,
  body text,
  created_at timestamptz,
  sender_username text,
  sender_avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_limit integer := GREATEST(1, LEAST(coalesce(p_limit, 30), 100));
BEGIN
  IF num_nonnulls(p_jam_id, p_series_id) <> 1 THEN
    RAISE EXCEPTION 'Exactly one of p_jam_id and p_series_id must be set' USING ERRCODE = '22023';
  END IF;

  -- One branch per room kind, so each uses its partial index.
  IF p_series_id IS NOT NULL THEN
    RETURN QUERY
      SELECT m.id, m.jam_id, m.series_id, m.sender_id, m.body, m.created_at, p.username::text, p.avatar_url
      FROM public.jam_messages m
      INNER JOIN public.profiles p ON p.id = m.sender_id
      WHERE m.series_id = p_series_id
        AND (p_cursor_id IS NULL OR (m.created_at, m.id) < (p_cursor_created_at, p_cursor_id))
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT v_limit;
  ELSE
    RETURN QUERY
      SELECT m.id, m.jam_id, m.series_id, m.sender_id, m.body, m.created_at, p.username::text, p.avatar_url
      FROM public.jam_messages m
      INNER JOIN public.profiles p ON p.id = m.sender_id
      WHERE m.jam_id = p_jam_id
        AND (p_cursor_id IS NULL OR (m.created_at, m.id) < (p_cursor_created_at, p_cursor_id))
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT v_limit;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_jam_messages(uuid, uuid, integer, timestamptz, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_jam_messages(uuid, uuid, integer, timestamptz, uuid) TO authenticated;

-- ============================================================================
-- Realtime and push
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.jam_messages;

-- pg_net sends the request after the commit; the Edge Function reads the message and its room itself.
CREATE OR REPLACE FUNCTION public.trigger_chat_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.invoke_notification_edge_function(
    'send-chat-message-notification',
    jsonb_build_object('message_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER jam_messages_chat_notification
  AFTER INSERT ON public.jam_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_chat_message_notification();
