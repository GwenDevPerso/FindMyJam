import type { PostgrestError } from '@supabase/supabase-js';

import type { JamListCursor, JamListFilters } from '@/features/jams/types';
import type {
  JamInsert,
  JamRow,
  JamUpdate,
  SearchJamRow,
} from '@/lib/supabase/types';
import { supabase } from '@/services/supabase';

const JAM_COLUMNS =
  'id, creator_id, title, description, starts_at, location_name, latitude, longitude, skill_level, max_participants, created_at, updated_at';

export type JamRepositoryResult<T> = {
  data: T;
  error: PostgrestError | null;
};

export type CreateJamRepositoryParams = {
  jam: JamInsert;
  instrumentIds: string[];
  styleIds: string[];
};

export type UpdateJamRepositoryParams = {
  jamId: string;
  jam: JamUpdate;
  instrumentIds: string[];
  styleIds: string[];
};

export type SearchJamsRepositoryParams = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  instrumentIds: string[] | null;
  styleIds: string[] | null;
  startsAfter: string;
  startsBefore: string | null;
  limit: number;
  cursor: JamListCursor | null;
};

function mapFiltersToSearchParams(filters: JamListFilters): SearchJamsRepositoryParams {
  return {
    latitude: filters.latitude,
    longitude: filters.longitude,
    radiusMeters: filters.radiusMeters,
    instrumentIds: filters.instrumentIds.length > 0 ? filters.instrumentIds : null,
    styleIds: filters.styleIds.length > 0 ? filters.styleIds : null,
    startsAfter: filters.startsAfter,
    startsBefore: filters.startsBefore,
    limit: filters.limit,
    cursor: filters.cursor,
  };
}

export const jamRepository = {
  findAll: async (): Promise<JamRepositoryResult<JamRow[]>> => {
    const { data, error } = await supabase
      .from('jams')
      .select(JAM_COLUMNS)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    return { data: data ?? [], error };
  },

  search: async (filters: JamListFilters): Promise<JamRepositoryResult<SearchJamRow[]>> => {
    const params = mapFiltersToSearchParams(filters);

    const { data, error } = await supabase.rpc('search_jams', {
      p_latitude: params.latitude,
      p_longitude: params.longitude,
      p_radius_meters: params.radiusMeters,
      p_instrument_ids: params.instrumentIds,
      p_style_ids: params.styleIds,
      p_starts_after: params.startsAfter,
      p_starts_before: params.startsBefore,
      p_limit: params.limit,
      p_cursor_distance: params.cursor?.distanceMeters ?? null,
      p_cursor_starts_at: params.cursor?.startsAt ?? null,
      p_cursor_id: params.cursor?.id ?? null,
    });

    return { data: data ?? [], error };
  },

  findById: async (jamId: string): Promise<JamRepositoryResult<JamRow | null>> => {
    const { data, error } = await supabase
      .from('jams')
      .select(JAM_COLUMNS)
      .eq('id', jamId)
      .maybeSingle();

    return { data, error };
  },

  getParticipantCount: async (jamId: string): Promise<JamRepositoryResult<number>> => {
    const { data, error } = await supabase.rpc('get_jam_participant_count', {
      p_jam_id: jamId,
    });

    return { data: data ?? 0, error };
  },

  getInstrumentIds: async (jamId: string): Promise<JamRepositoryResult<string[]>> => {
    const { data, error } = await supabase
      .from('jam_instruments')
      .select('instrument_id')
      .eq('jam_id', jamId);

    if (error !== null) {
      return { data: [], error };
    }

    return {
      data: data.map((row) => row.instrument_id),
      error: null,
    };
  },

  getStyleIds: async (jamId: string): Promise<JamRepositoryResult<string[]>> => {
    const { data, error } = await supabase
      .from('jam_styles')
      .select('music_style_id')
      .eq('jam_id', jamId);

    if (error !== null) {
      return { data: [], error };
    }

    return {
      data: data.map((row) => row.music_style_id),
      error: null,
    };
  },

  create: async (params: CreateJamRepositoryParams): Promise<JamRepositoryResult<JamRow | null>> => {
    const { data, error } = await supabase.from('jams').insert(params.jam).select(JAM_COLUMNS).single();

    if (error !== null) {
      return { data: null, error };
    }

    if (data === null) {
      return { data: null, error: null };
    }

    if (params.instrumentIds.length > 0) {
      const { error: instrumentError } = await supabase.from('jam_instruments').insert(
        params.instrumentIds.map((instrumentId) => ({
          jam_id: data.id,
          instrument_id: instrumentId,
        })),
      );

      if (instrumentError !== null) {
        await supabase.from('jams').delete().eq('id', data.id);
        return { data, error: instrumentError };
      }
    }

    if (params.styleIds.length > 0) {
      const { error: styleError } = await supabase.from('jam_styles').insert(
        params.styleIds.map((styleId) => ({
          jam_id: data.id,
          music_style_id: styleId,
        })),
      );

      if (styleError !== null) {
        await supabase.from('jams').delete().eq('id', data.id);
        return { data, error: styleError };
      }
    }

    return { data, error: null };
  },

  update: async (params: UpdateJamRepositoryParams): Promise<JamRepositoryResult<JamRow | null>> => {
    const { data, error } = await supabase
      .from('jams')
      .update(params.jam)
      .eq('id', params.jamId)
      .select(JAM_COLUMNS)
      .single();

    if (error !== null) {
      return { data: null, error };
    }

    if (data === null) {
      return { data: null, error: null };
    }

    const { error: deleteInstrumentsError } = await supabase
      .from('jam_instruments')
      .delete()
      .eq('jam_id', params.jamId);

    if (deleteInstrumentsError !== null) {
      return { data, error: deleteInstrumentsError };
    }

    const { error: deleteStylesError } = await supabase
      .from('jam_styles')
      .delete()
      .eq('jam_id', params.jamId);

    if (deleteStylesError !== null) {
      return { data, error: deleteStylesError };
    }

    if (params.instrumentIds.length > 0) {
      const { error: instrumentError } = await supabase.from('jam_instruments').insert(
        params.instrumentIds.map((instrumentId) => ({
          jam_id: params.jamId,
          instrument_id: instrumentId,
        })),
      );

      if (instrumentError !== null) {
        return { data, error: instrumentError };
      }
    }

    if (params.styleIds.length > 0) {
      const { error: styleError } = await supabase.from('jam_styles').insert(
        params.styleIds.map((styleId) => ({
          jam_id: params.jamId,
          music_style_id: styleId,
        })),
      );

      if (styleError !== null) {
        return { data, error: styleError };
      }
    }

    return { data, error: null };
  },

  delete: async (jamId: string): Promise<{ error: PostgrestError | null }> => {
    const { error } = await supabase.from('jams').delete().eq('id', jamId);

    return { error };
  },

  findByCreatorId: async (creatorId: string): Promise<JamRepositoryResult<JamRow[]>> => {
    const { data, error } = await supabase
      .from('jams')
      .select(JAM_COLUMNS)
      .eq('creator_id', creatorId)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    return { data: data ?? [], error };
  },

  findParticipatedByUserId: async (userId: string): Promise<JamRepositoryResult<JamRow[]>> => {
    const { data, error } = await supabase
      .from('jam_participants')
      .select(`jams(${JAM_COLUMNS})`)
      .eq('user_id', userId);

    if (error !== null) {
      return { data: [], error };
    }

    const now = new Date().toISOString();
    const jams = (data ?? [])
      .map((row) => {
        const jam = row.jams as JamRow | JamRow[] | null;
        if (Array.isArray(jam)) {
          return jam[0] ?? null;
        }
        return jam;
      })
      .filter((jam): jam is JamRow => jam !== null && jam.starts_at >= now)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

    return { data: jams, error: null };
  },
};
