-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;

-- Enums
CREATE TYPE public.skill_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'all_levels'
);

CREATE TYPE public.friendship_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'blocked'
);

-- Shared trigger function: auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Geography point from lat/lng (nullable-safe)
CREATE OR REPLACE FUNCTION public.make_geography_point(
  p_latitude double precision,
  p_longitude double precision
)
RETURNS extensions.geography(Point, 4326)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_latitude IS NULL OR p_longitude IS NULL THEN NULL
    WHEN p_latitude < -90 OR p_latitude > 90 THEN NULL
    WHEN p_longitude < -180 OR p_longitude > 180 THEN NULL
    ELSE extensions.st_setsrid(
      extensions.st_makepoint(p_longitude, p_latitude),
      4326
    )::extensions.geography
  END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'username'), ''),
      'user_' || substr(replace(NEW.id::text, '-', ''), 1, 8)
    )
  );
  RETURN NEW;
END;
$$;
