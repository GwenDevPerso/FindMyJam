import type { PostgrestError } from '@supabase/supabase-js';

import type {
  FriendshipInsert,
  FriendshipRow,
  FriendshipStatus,
  FriendshipUpdate,
  SearchProfileRow,
} from '@/lib/supabase/types';
import { supabase } from '@/services/supabase';

export type FriendRepositoryResult<T> = {
  data: T;
  error: PostgrestError | null;
};

export type SearchProfilesParams = {
  query: string | null;
  instrumentIds: string[] | null;
  styleIds: string[] | null;
  limit: number;
};

const FRIENDSHIP_COLUMNS = 'id, requester_id, addressee_id, status, created_at, updated_at';

type FriendshipProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type FriendshipWithProfilesQueryRow = FriendshipRow & {
  requester: FriendshipProfileRow | FriendshipProfileRow[] | null;
  addressee: FriendshipProfileRow | FriendshipProfileRow[] | null;
};

function resolveProfile(
  profile: FriendshipProfileRow | FriendshipProfileRow[] | null,
): FriendshipProfileRow | null {
  if (profile === null) {
    return null;
  }

  if (Array.isArray(profile)) {
    return profile[0] ?? null;
  }

  return profile;
}

export type FriendshipWithProfiles = FriendshipRow & {
  requester: FriendshipProfileRow;
  addressee: FriendshipProfileRow;
};

function mapFriendshipWithProfiles(row: FriendshipWithProfilesQueryRow): FriendshipWithProfiles | null {
  const requester = resolveProfile(row.requester);
  const addressee = resolveProfile(row.addressee);

  if (requester === null || addressee === null) {
    return null;
  }

  return {
    id: row.id,
    requester_id: row.requester_id,
    addressee_id: row.addressee_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    requester,
    addressee,
  };
}

const FRIENDSHIP_WITH_PROFILES_SELECT = `
  ${FRIENDSHIP_COLUMNS},
  requester:profiles!friendships_requester_id_fkey(id, username, avatar_url),
  addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_url)
`;

export const friendRepository = {
  searchProfiles: async (
    params: SearchProfilesParams,
  ): Promise<FriendRepositoryResult<SearchProfileRow[]>> => {
    const { data, error } = await supabase.rpc('search_profiles', {
      p_query: params.query,
      p_instrument_ids: params.instrumentIds,
      p_style_ids: params.styleIds,
      p_limit: params.limit,
      p_cursor_username: null,
      p_cursor_id: null,
    });

    if (error !== null) {
      return { data: [], error };
    }

    return { data: data ?? [], error: null };
  },

  findById: async (friendshipId: string): Promise<FriendRepositoryResult<FriendshipRow | null>> => {
    const { data, error } = await supabase
      .from('friendships')
      .select(FRIENDSHIP_COLUMNS)
      .eq('id', friendshipId)
      .maybeSingle();

    return { data, error };
  },

  findBetweenUsers: async (
    userId: string,
    otherUserId: string,
  ): Promise<FriendRepositoryResult<FriendshipRow | null>> => {
    const { data, error } = await supabase
      .from('friendships')
      .select(FRIENDSHIP_COLUMNS)
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`,
      )
      .maybeSingle();

    return { data, error };
  },

  findByUserAndStatus: async (
    userId: string,
    status: FriendshipStatus,
  ): Promise<FriendRepositoryResult<FriendshipWithProfiles[]>> => {
    const { data, error } = await supabase
      .from('friendships')
      .select(FRIENDSHIP_WITH_PROFILES_SELECT)
      .eq('status', status)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error !== null) {
      return { data: [], error };
    }

    const rows = (data ?? []) as FriendshipWithProfilesQueryRow[];

    return {
      data: rows
        .map(mapFriendshipWithProfiles)
        .filter((row): row is FriendshipWithProfiles => row !== null),
      error: null,
    };
  },

  findPendingIncoming: async (userId: string): Promise<FriendRepositoryResult<FriendshipWithProfiles[]>> => {
    const { data, error } = await supabase
      .from('friendships')
      .select(FRIENDSHIP_WITH_PROFILES_SELECT)
      .eq('status', 'pending')
      .eq('addressee_id', userId)
      .order('created_at', { ascending: false });

    if (error !== null) {
      return { data: [], error };
    }

    const rows = (data ?? []) as FriendshipWithProfilesQueryRow[];

    return {
      data: rows
        .map(mapFriendshipWithProfiles)
        .filter((row): row is FriendshipWithProfiles => row !== null),
      error: null,
    };
  },

  findRelationsForUsers: async (
    userId: string,
    targetUserIds: string[],
  ): Promise<FriendRepositoryResult<FriendshipRow[]>> => {
    if (targetUserIds.length === 0) {
      return { data: [], error: null };
    }

    const targetUserIdSet = new Set(targetUserIds);

    const { data, error } = await supabase
      .from('friendships')
      .select(FRIENDSHIP_COLUMNS)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error !== null) {
      return { data: [], error };
    }

    const friendships = (data ?? []).filter(
      (friendship) =>
        targetUserIdSet.has(friendship.requester_id) || targetUserIdSet.has(friendship.addressee_id),
    );

    return { data: friendships, error: null };
  },

  create: async (friendship: FriendshipInsert): Promise<FriendRepositoryResult<FriendshipRow>> => {
    const { data, error } = await supabase
      .from('friendships')
      .insert(friendship)
      .select(FRIENDSHIP_COLUMNS)
      .single();

    if (error !== null || data === null) {
      return { data: data as unknown as FriendshipRow, error };
    }

    return { data, error: null };
  },

  update: async (
    friendshipId: string,
    friendship: FriendshipUpdate,
  ): Promise<FriendRepositoryResult<FriendshipRow>> => {
    const { data, error } = await supabase
      .from('friendships')
      .update(friendship)
      .eq('id', friendshipId)
      .select(FRIENDSHIP_COLUMNS)
      .single();

    if (error !== null || data === null) {
      return { data: data as unknown as FriendshipRow, error };
    }

    return { data, error: null };
  },

  delete: async (friendshipId: string): Promise<{ error: PostgrestError | null }> => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);

    return { error };
  },
};
