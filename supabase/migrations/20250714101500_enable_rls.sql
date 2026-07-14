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
