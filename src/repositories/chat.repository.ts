import type { PostgrestError } from '@supabase/supabase-js';

import type { ChatMessageListCursor } from '@/features/chat/types';
import type { JamMessageInsert, JamMessageRow, JamMessageWithSenderRow } from '@/lib/supabase/types';
import { supabase } from '@/services/supabase';

export type ChatRepositoryResult<T> = {
  data: T;
  error: PostgrestError | null;
};

const MESSAGE_COLUMNS = 'id, jam_id, series_id, sender_id, body, created_at';

/** Exactly one of `jamId` / `seriesId` is set: the room of a one-off jam or of a series. */
export type ListChatMessagesParams = {
  jamId: string | null;
  seriesId: string | null;
  limit: number;
  cursor: ChatMessageListCursor | null;
};

/** `jam_messages`. RLS restricts reads and writes to the creator and the participants of the room. */
export const chatRepository = {
  list: async (
    params: ListChatMessagesParams,
  ): Promise<ChatRepositoryResult<JamMessageWithSenderRow[]>> => {
    const { data, error } = await supabase.rpc('get_jam_messages', {
      p_jam_id: params.jamId,
      p_series_id: params.seriesId,
      p_limit: params.limit,
      p_cursor_created_at: params.cursor?.createdAt ?? null,
      p_cursor_id: params.cursor?.id ?? null,
    });

    return { data: data ?? [], error };
  },

  send: async (message: JamMessageInsert): Promise<ChatRepositoryResult<JamMessageRow | null>> => {
    const { data, error } = await supabase
      .from('jam_messages')
      .insert(message)
      .select(MESSAGE_COLUMNS)
      .single();

    return { data, error };
  },

  delete: async (userId: string, messageId: string): Promise<{ error: PostgrestError | null }> => {
    const { error } = await supabase
      .from('jam_messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId);

    return { error };
  },
};
