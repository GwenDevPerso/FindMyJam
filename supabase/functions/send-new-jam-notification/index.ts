import { createNotificationsForUsers } from '../_shared/notification-service.ts';
import { createServiceClient, createErrorResponse, createJsonResponse } from '../_shared/supabase.ts';
import type { CreateNotificationInput, JamRow, NewJamRecipientRow, NotificationType } from '../_shared/types.ts';

type NewJamPayload = {
  jam_id: string;
};

function buildNotificationContent(
  type: NotificationType,
  jam: JamRow,
): Pick<CreateNotificationInput, 'title' | 'body' | 'data'> {
  const baseData = {
    jam_id: jam.id,
    action: 'open_jam',
    navigation_target: `/jams/${jam.id}`,
  };

  switch (type) {
    case 'NEW_JAM_MATCH':
      return {
        title: 'Jam matching your tastes',
        body: `A new jam "${jam.title}" matches your musical profile`,
        data: baseData,
      };
    case 'NEW_JAM_RADIUS':
      return {
        title: 'New jam nearby',
        body: `A new jam "${jam.title}" was created near you`,
        data: baseData,
      };
    case 'NEW_JAM_CITY':
      return {
        title: 'New jam in your city',
        body: `A new jam "${jam.title}" was created in your city`,
        data: baseData,
      };
    default:
      return {
        title: 'New jam',
        body: `A new jam "${jam.title}" was created`,
        data: baseData,
      };
  }
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const payload = (await request.json()) as NewJamPayload;
    const supabase = createServiceClient();

    const { data: jam, error: jamError } = await supabase
      .from('jams')
      .select('id, creator_id, title, starts_at')
      .eq('id', payload.jam_id)
      .single();

    if (jamError !== null || jam === null) {
      throw new Error(`Jam not found: ${payload.jam_id}`);
    }

    const { data: recipients, error: recipientsError } = await supabase.rpc(
      'find_new_jam_notification_recipients',
      { p_jam_id: payload.jam_id },
    );

    if (recipientsError !== null) {
      throw new Error(`Failed to find recipients: ${recipientsError.message}`);
    }

    const rows = (recipients ?? []) as NewJamRecipientRow[];

    const inputs: CreateNotificationInput[] = rows.map((recipient) => {
      const content = buildNotificationContent(recipient.notification_type, jam as JamRow);

      return {
        userId: recipient.user_id,
        type: recipient.notification_type,
        title: content.title,
        body: content.body,
        data: content.data,
      };
    });

    const createdCount = await createNotificationsForUsers(supabase, inputs);

    return createJsonResponse({
      success: true,
      created_count: createdCount,
      recipient_count: rows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-new-jam-notification error:', message);
    return createErrorResponse(message);
  }
});
