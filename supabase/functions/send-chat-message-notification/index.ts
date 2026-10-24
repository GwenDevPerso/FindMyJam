import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { sendPushToUsers } from '../_shared/notification-service.ts';
import { createServiceClient, createErrorResponse, createJsonResponse, isServiceRoleRequest } from '../_shared/supabase.ts';
import type { JamMessageRow, JamRow, JamSeriesRow, ProfileRow, PushInput } from '../_shared/types.ts';

type ChatMessagePayload = {
  message_id: string;
};

type ParticipantRow = {
  user_id: string;
};

type SeriesJamRow = {
  id: string;
};

const MAX_PREVIEW_LENGTH = 140;

function truncate(text: string, maxLength: number): string {
  const singleLine = text.replace(/\s+/g, ' ').trim();

  return singleLine.length > maxLength ? `${singleLine.slice(0, maxLength - 1)}…` : singleLine;
}

type Room = {
  title: string;
  /** Jam the push opens: the jam itself, or the next date of the series (the last one if none is upcoming). */
  jamId: string;
  memberIds: string[];
};

async function loadJamRoom(supabase: SupabaseClient, jamId: string): Promise<Room | null> {
  const { data: jam, error: jamError } = await supabase
    .from('jams')
    .select('id, creator_id, title, starts_at')
    .eq('id', jamId)
    .maybeSingle();

  if (jamError !== null) {
    throw new Error(`Failed to fetch jam: ${jamError.message}`);
  }

  if (jam === null) {
    return null;
  }

  const { data: participants, error: participantsError } = await supabase
    .from('jam_participants')
    .select('user_id')
    .eq('jam_id', jamId);

  if (participantsError !== null) {
    throw new Error(`Failed to fetch participants: ${participantsError.message}`);
  }

  const jamRow = jam as JamRow;

  return {
    title: jamRow.title,
    jamId: jamRow.id,
    memberIds: [jamRow.creator_id, ...((participants ?? []) as ParticipantRow[]).map((row) => row.user_id)],
  };
}

/** Next date of the series, or its last one when none is upcoming. */
async function findSeriesTargetJam(supabase: SupabaseClient, seriesId: string): Promise<SeriesJamRow | null> {
  const { data: upcoming, error: upcomingError } = await supabase
    .from('jams')
    .select('id')
    .eq('series_id', seriesId)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (upcomingError !== null) {
    throw new Error(`Failed to fetch series dates: ${upcomingError.message}`);
  }

  if (upcoming !== null) {
    return upcoming as SeriesJamRow;
  }

  const { data: latest, error: latestError } = await supabase
    .from('jams')
    .select('id')
    .eq('series_id', seriesId)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError !== null) {
    throw new Error(`Failed to fetch series dates: ${latestError.message}`);
  }

  return (latest as SeriesJamRow | null) ?? null;
}

async function loadSeriesRoom(supabase: SupabaseClient, seriesId: string): Promise<Room | null> {
  const { data: series, error: seriesError } = await supabase
    .from('jam_series')
    .select('id, creator_id, title')
    .eq('id', seriesId)
    .maybeSingle();

  if (seriesError !== null) {
    throw new Error(`Failed to fetch series: ${seriesError.message}`);
  }

  if (series === null) {
    return null;
  }

  const targetJam = await findSeriesTargetJam(supabase, seriesId);

  if (targetJam === null) {
    return null;
  }

  // Participants of any date of the series.
  const { data: participants, error: participantsError } = await supabase
    .from('jam_participants')
    .select('user_id, jams!inner(series_id)')
    .eq('jams.series_id', seriesId);

  if (participantsError !== null) {
    throw new Error(`Failed to fetch participants: ${participantsError.message}`);
  }

  const seriesRow = series as JamSeriesRow;

  return {
    title: seriesRow.title,
    jamId: targetJam.id,
    memberIds: [seriesRow.creator_id, ...((participants ?? []) as ParticipantRow[]).map((row) => row.user_id)],
  };
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  if (!isServiceRoleRequest(request)) {
    return createErrorResponse('Forbidden', 403);
  }

  try {
    const payload = (await request.json()) as ChatMessagePayload;
    const supabase = createServiceClient();

    const { data: message, error: messageError } = await supabase
      .from('jam_messages')
      .select('id, jam_id, series_id, sender_id, body')
      .eq('id', payload.message_id)
      .maybeSingle();

    if (messageError !== null) {
      throw new Error(`Failed to fetch message: ${messageError.message}`);
    }

    // Deleted before the request ran: nothing to announce.
    if (message === null) {
      return createJsonResponse({ success: true, sent_count: 0 });
    }

    const messageRow = message as JamMessageRow;
    const room =
      messageRow.series_id !== null
        ? await loadSeriesRoom(supabase, messageRow.series_id)
        : messageRow.jam_id !== null
          ? await loadJamRoom(supabase, messageRow.jam_id)
          : null;

    if (room === null) {
      return createJsonResponse({ success: true, sent_count: 0 });
    }

    const recipientIds = [...new Set(room.memberIds)].filter((userId) => userId !== messageRow.sender_id);

    if (recipientIds.length === 0) {
      return createJsonResponse({ success: true, sent_count: 0 });
    }

    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('user_id, chat_messages')
      .in('user_id', recipientIds);

    if (preferencesError !== null) {
      throw new Error(`Failed to fetch preferences: ${preferencesError.message}`);
    }

    const enabledUserIds = new Set(
      (preferences ?? [])
        .filter((preference) => preference.chat_messages === true)
        .map((preference) => preference.user_id),
    );

    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', messageRow.sender_id)
      .maybeSingle();

    if (senderError !== null) {
      throw new Error(`Failed to fetch sender: ${senderError.message}`);
    }

    const senderName = (sender as ProfileRow | null)?.username ?? 'Someone';

    const inputs: PushInput[] = recipientIds
      .filter((userId) => enabledUserIds.has(userId))
      .map((userId) => ({
        userId,
        title: room.title,
        body: `${senderName}: ${truncate(messageRow.body, MAX_PREVIEW_LENGTH)}`,
        data: {
          type: 'CHAT_MESSAGE',
          jam_id: room.jamId,
          action: 'open_chat',
          navigation_target: `/jams/chat/${room.jamId}`,
        },
      }));

    const sentCount = await sendPushToUsers(supabase, inputs);

    return createJsonResponse({ success: true, sent_count: sentCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-chat-message-notification error:', message);
    return createErrorResponse(message);
  }
});
