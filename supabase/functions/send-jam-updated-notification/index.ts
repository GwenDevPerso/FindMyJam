import { createNotificationsForUsers } from '../_shared/notification-service.ts';
import { createServiceClient, createErrorResponse, createJsonResponse } from '../_shared/supabase.ts';
import type { CreateNotificationInput, JamRow } from '../_shared/types.ts';

type JamUpdatedPayload = {
  jam_id: string;
};

type ParticipantRow = {
  user_id: string;
};

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const payload = (await request.json()) as JamUpdatedPayload;
    const supabase = createServiceClient();

    const { data: jam, error: jamError } = await supabase
      .from('jams')
      .select('id, creator_id, title, starts_at')
      .eq('id', payload.jam_id)
      .single();

    if (jamError !== null || jam === null) {
      throw new Error(`Jam not found: ${payload.jam_id}`);
    }

    const { data: participants, error: participantsError } = await supabase
      .from('jam_participants')
      .select('user_id')
      .eq('jam_id', payload.jam_id);

    if (participantsError !== null) {
      throw new Error(`Failed to fetch participants: ${participantsError.message}`);
    }

    const participantRows = (participants ?? []) as ParticipantRow[];
    const userIds = participantRows.map((row) => row.user_id);

    if (userIds.length === 0) {
      return createJsonResponse({ success: true, created_count: 0 });
    }

    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('user_id, jam_updates')
      .in('user_id', userIds);

    if (preferencesError !== null) {
      throw new Error(`Failed to fetch preferences: ${preferencesError.message}`);
    }

    const enabledUserIds = new Set(
      (preferences ?? [])
        .filter((preference) => preference.jam_updates === true)
        .map((preference) => preference.user_id),
    );

    const inputs: CreateNotificationInput[] = userIds
      .filter((userId) => enabledUserIds.has(userId))
      .map((userId) => ({
        userId,
        type: 'JAM_UPDATED',
        title: 'Jam updated',
        body: `The jam "${(jam as JamRow).title}" has been updated`,
        data: {
          jam_id: payload.jam_id,
          action: 'open_jam',
          navigation_target: `/jams/${payload.jam_id}`,
        },
      }));

    const createdCount = await createNotificationsForUsers(supabase, inputs);

    return createJsonResponse({ success: true, created_count: createdCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-jam-updated-notification error:', message);
    return createErrorResponse(message);
  }
});
