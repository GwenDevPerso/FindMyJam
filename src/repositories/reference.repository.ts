import type { PostgrestError } from '@supabase/supabase-js';

import type { InstrumentRow, MusicStyleRow } from '@/lib/supabase/types';
import { supabase } from '@/services/supabase';

export type ReferenceRepositoryResult<T> = {
  data: T;
  error: PostgrestError | null;
};

const REFERENCE_COLUMNS = 'id, name, slug, created_at';

export const referenceRepository = {
  getInstruments: async (): Promise<ReferenceRepositoryResult<InstrumentRow[]>> => {
    const { data, error } = await supabase
      .from('instruments')
      .select(REFERENCE_COLUMNS)
      .order('name', { ascending: true });

    return { data: data ?? [], error };
  },

  getMusicStyles: async (): Promise<ReferenceRepositoryResult<MusicStyleRow[]>> => {
    const { data, error } = await supabase
      .from('music_styles')
      .select(REFERENCE_COLUMNS)
      .order('name', { ascending: true });

    return { data: data ?? [], error };
  },
};
