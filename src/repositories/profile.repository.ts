import type { PostgrestError } from '@supabase/supabase-js';

import type { ProfileRow, ProfileUpdate } from '@/lib/supabase/types';
import { supabase } from '@/services/supabase';

const AVATAR_BUCKET = 'avatars';
const AVATAR_EXTENSION = 'jpg';

type ProfileRepositoryError = PostgrestError | { message: string; name: 'StorageError' };

export type ProfileRepositoryResult<T> = {
  data: T;
  error: ProfileRepositoryError | null;
};

export type UploadAvatarRepositoryParams = {
  userId: string;
  fileData: ArrayBuffer;
  contentType: string;
};

const PROFILE_COLUMNS =
  'id, username, avatar_url, bio, skill_level, location_name, latitude, longitude, created_at, updated_at';

function buildAvatarPath(userId: string): string {
  return `${userId}/avatar.${AVATAR_EXTENSION}`;
}

export const profileRepository = {
  findById: async (userId: string): Promise<ProfileRepositoryResult<ProfileRow | null>> => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle();

    return { data, error };
  },

  update: async (
    userId: string,
    profile: ProfileUpdate,
  ): Promise<ProfileRepositoryResult<ProfileRow>> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId)
      .select(PROFILE_COLUMNS)
      .single();

    if (error !== null || data === null) {
      return { data: data as unknown as ProfileRow, error };
    }

    return { data, error: null };
  },

  getInstrumentIds: async (userId: string): Promise<ProfileRepositoryResult<string[]>> => {
    const { data, error } = await supabase
      .from('user_instruments')
      .select('instrument_id')
      .eq('user_id', userId);

    if (error !== null) {
      return { data: [], error };
    }

    return {
      data: data.map((row) => row.instrument_id),
      error: null,
    };
  },

  getStyleIds: async (userId: string): Promise<ProfileRepositoryResult<string[]>> => {
    const { data, error } = await supabase
      .from('user_music_styles')
      .select('music_style_id')
      .eq('user_id', userId);

    if (error !== null) {
      return { data: [], error };
    }

    return {
      data: data.map((row) => row.music_style_id),
      error: null,
    };
  },

  setInstruments: async (
    userId: string,
    instrumentIds: string[],
  ): Promise<{ error: PostgrestError | null }> => {
    const { error: deleteError } = await supabase
      .from('user_instruments')
      .delete()
      .eq('user_id', userId);

    if (deleteError !== null) {
      return { error: deleteError };
    }

    if (instrumentIds.length === 0) {
      return { error: null };
    }

    const { error: insertError } = await supabase.from('user_instruments').insert(
      instrumentIds.map((instrumentId) => ({
        user_id: userId,
        instrument_id: instrumentId,
      })),
    );

    return { error: insertError };
  },

  setStyles: async (
    userId: string,
    styleIds: string[],
  ): Promise<{ error: PostgrestError | null }> => {
    const { error: deleteError } = await supabase
      .from('user_music_styles')
      .delete()
      .eq('user_id', userId);

    if (deleteError !== null) {
      return { error: deleteError };
    }

    if (styleIds.length === 0) {
      return { error: null };
    }

    const { error: insertError } = await supabase.from('user_music_styles').insert(
      styleIds.map((styleId) => ({
        user_id: userId,
        music_style_id: styleId,
      })),
    );

    return { error: insertError };
  },

  uploadAvatar: async (
    params: UploadAvatarRepositoryParams,
  ): Promise<ProfileRepositoryResult<string>> => {
    const path = buildAvatarPath(params.userId);

    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, params.fileData, {
      upsert: true,
      contentType: params.contentType,
    });

    if (uploadError !== null) {
      return {
        data: '',
        error: { message: uploadError.message, name: 'StorageError' },
      };
    }

    const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', params.userId)
      .select('avatar_url')
      .single();

    if (error !== null || data === null) {
      return { data: avatarUrl, error };
    }

    return { data: data.avatar_url ?? avatarUrl, error: null };
  },
};
