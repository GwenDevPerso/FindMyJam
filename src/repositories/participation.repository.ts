import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';
import type { JamParticipant } from '@/types/domain';

export type ParticipationRepositoryResult<T> = {
  data: T;
  error: PostgrestError | null;
};

type ParticipantProfileRow = {
  username: string;
  avatar_url: string | null;
};

type JamParticipantQueryRow = {
  jam_id: string;
  user_id: string;
  joined_at: string;
  profiles: ParticipantProfileRow | ParticipantProfileRow[] | null;
};

function mapParticipantRow(row: JamParticipantQueryRow): JamParticipant {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  if (profile === null || profile === undefined) {
    throw new Error(`Missing profile for participant ${row.user_id}`);
  }

  return {
    jamId: row.jam_id,
    userId: row.user_id,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    joinedAt: row.joined_at,
  };
}

export const participationRepository = {
  findByJamId: async (jamId: string): Promise<ParticipationRepositoryResult<JamParticipant[]>> => {
    const { data, error } = await supabase
      .from('jam_participants')
      .select('jam_id, user_id, joined_at, profiles(username, avatar_url)')
      .eq('jam_id', jamId)
      .order('joined_at', { ascending: true });

    if (error !== null) {
      return { data: [], error };
    }

    const rows = (data ?? []) as JamParticipantQueryRow[];

    return {
      data: rows.map(mapParticipantRow),
      error: null,
    };
  },

  isParticipant: async (
    jamId: string,
    userId: string,
  ): Promise<ParticipationRepositoryResult<boolean>> => {
    const { data, error } = await supabase
      .from('jam_participants')
      .select('jam_id')
      .eq('jam_id', jamId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error !== null) {
      return { data: false, error };
    }

    return { data: data !== null, error: null };
  },

  join: async (jamId: string, userId: string): Promise<{ error: PostgrestError | null }> => {
    const { error } = await supabase.from('jam_participants').insert({
      jam_id: jamId,
      user_id: userId,
    });

    return { error };
  },

  leave: async (jamId: string, userId: string): Promise<{ error: PostgrestError | null }> => {
    const { error } = await supabase
      .from('jam_participants')
      .delete()
      .eq('jam_id', jamId)
      .eq('user_id', userId);

    return { error };
  },
};
