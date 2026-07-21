import { createNotification } from '../_shared/notification-service.ts';
import { createServiceClient, createErrorResponse, createJsonResponse } from '../_shared/supabase.ts';
import type { CreateNotificationInput, JamStartingRow } from '../_shared/types.ts';

type JamStartingSoonPayload = {
  minutes_before?: number;
};

type ParticipantRow = {
  user_id: string;
};

const SUPPORTED_MINUTES = [60, 15] as const;

function buildStartingSoonMessage(minutesBefore: number, title: string): Pick<CreateNotificationInput, 'title' | 'body'> {
  if (minutesBefore === 60) {
    return {
      title: 'Jam starting in 1 hour',
      body: `"${title}" starts in 1 hour`,
    };
  }

  return {
    title: 'Jam starting in 15 minutes',
    body: `"${title}" starts in 15 minutes`,
  };
}

async function notifyJamParticipants(
  supabase: ReturnType<typeof createServiceClient>,
  jam: JamStartingRow,
  minutesBefore: number,
): Promise<number> {
  const { data: participants, error: participantsError } = await supabase
    .from('jam_participants')
    .select('user_id')
    .eq('jam_id', jam.jam_id);

  if (participantsError !== null) {
    throw new Error(`Failed to fetch participants: ${participantsError.message}`);
  }

  const participantRows = (participants ?? []) as ParticipantRow[];
  const userIds = [
    ...new Set([
      ...participantRows.map((row) => row.user_id),
      jam.creator_id,
    ]),
  ];

  if (userIds.length === 0) {
    return 0;
  }

  const { data: preferences, error: preferencesError } = await supabase
    .from('notification_preferences')
    .select('user_id, jam_starting')
    .in('user_id', userIds);

  if (preferencesError !== null) {
    throw new Error(`Failed to fetch preferences: ${preferencesError.message}`);
  }

  const enabledUserIds = new Set(
    (preferences ?? [])
      .filter((preference) => preference.jam_starting === true)
      .map((preference) => preference.user_id),
  );

  const message = buildStartingSoonMessage(minutesBefore, jam.title);
  let createdCount = 0;

  for (const userId of userIds) {
    if (!enabledUserIds.has(userId)) {
      continue;
    }

    const { data: existingLog, error: logError } = await supabase
      .from('jam_starting_notification_log')
      .select('jam_id')
      .eq('jam_id', jam.jam_id)
      .eq('user_id', userId)
      .eq('minutes_before', minutesBefore)
      .maybeSingle();

    if (logError !== null) {
      throw new Error(`Failed to check notification log: ${logError.message}`);
    }

    if (existingLog !== null) {
      continue;
    }

    await createNotification(supabase, {
      userId,
      type: 'JAM_STARTING_SOON',
      title: message.title,
      body: message.body,
      data: {
        jam_id: jam.jam_id,
        minutes_before: minutesBefore,
        action: 'open_jam',
        navigation_target: `/jams/${jam.jam_id}`,
      },
    });

    const { error: insertLogError } = await supabase.from('jam_starting_notification_log').insert({
      jam_id: jam.jam_id,
      user_id: userId,
      minutes_before: minutesBefore,
    });

    if (insertLogError !== null) {
      throw new Error(`Failed to log notification: ${insertLogError.message}`);
    }

    createdCount += 1;
  }

  return createdCount;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const payload = (await request.json()) as JamStartingSoonPayload;
    const supabase = createServiceClient();

    const minutesList =
      payload.minutes_before !== undefined && SUPPORTED_MINUTES.includes(payload.minutes_before as 60 | 15)
        ? [payload.minutes_before as 60 | 15]
        : [...SUPPORTED_MINUTES];

    let totalCreated = 0;

    for (const minutesBefore of minutesList) {
      const { data: jams, error: jamsError } = await supabase.rpc('find_jams_starting_soon', {
        p_minutes_before: minutesBefore,
      });

      if (jamsError !== null) {
        throw new Error(`Failed to find jams: ${jamsError.message}`);
      }

      const jamRows = (jams ?? []) as JamStartingRow[];

      for (const jam of jamRows) {
        const createdCount = await notifyJamParticipants(supabase, jam, minutesBefore);
        totalCreated += createdCount;
      }
    }

    return createJsonResponse({ success: true, created_count: totalCreated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-jam-starting-soon-notification error:', message);
    return createErrorResponse(message);
  }
});
