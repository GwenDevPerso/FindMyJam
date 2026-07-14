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
