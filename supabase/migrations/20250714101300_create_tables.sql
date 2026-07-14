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
