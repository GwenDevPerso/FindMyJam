import type { PostgrestError } from '@supabase/supabase-js';

import type {
  CreateJamSeriesArgs,
  CreateJamSeriesResultRow,
  JamSeriesRow,
  UpdateJamSeriesArgs,
} from '@/lib/supabase/types';
import { supabase } from '@/services/supabase';

const JAM_SERIES_COLUMNS =
  'id, creator_id, frequency, anchor_date, local_time, timezone, title, description, location_name, latitude, longitude, skill_level, max_participants, instrument_ids, style_ids, generated_until, created_at, updated_at';

export type JamSeriesRepositoryResult<T> = {
  data: T;
  error: PostgrestError | null;
};

/** `jam_series` and its RPCs. Writes go through RPCs so that a series and its dates change in one transaction. */
export const jamSeriesRepository = {
  findById: async (seriesId: string): Promise<JamSeriesRepositoryResult<JamSeriesRow | null>> => {
    const { data, error } = await supabase
      .from('jam_series')
      .select(JAM_SERIES_COLUMNS)
      .eq('id', seriesId)
      .maybeSingle();

    return { data, error };
  },

  create: async (
    args: CreateJamSeriesArgs,
  ): Promise<JamSeriesRepositoryResult<CreateJamSeriesResultRow | null>> => {
    const { data, error } = await supabase.rpc('create_jam_series', args).single();

    return { data: (data as CreateJamSeriesResultRow | null) ?? null, error };
  },

  update: async (args: UpdateJamSeriesArgs): Promise<{ error: PostgrestError | null }> => {
    const { error } = await supabase.rpc('update_jam_series', args);

    return { error };
  },

  delete: async (seriesId: string): Promise<{ error: PostgrestError | null }> => {
    const { error } = await supabase.rpc('delete_jam_series', { p_series_id: seriesId });

    return { error };
  },
};
