import { createNotificationsForUsers } from '../_shared/notification-service.ts';
import { createServiceClient, createErrorResponse, createJsonResponse, isServiceRoleRequest } from '../_shared/supabase.ts';
import type { CreateNotificationInput, JamRow } from '../_shared/types.ts';

type WaitlistPromotedPayload = {
  jam_id: string;
  user_id: string;
};

// Sent by `jam_participants_promote_waitlist` once the first person waiting has been moved into a freed spot.
// Not gated by a notification preference: the user became a participant without doing anything and must know.
Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  if (!isServiceRoleRequest(request)) {
    return createErrorResponse('Forbidden', 403);
  }

  try {
    const payload = (await request.json()) as WaitlistPromotedPayload;
    const supabase = createServiceClient();

    const { data: jam, error: jamError } = await supabase
      .from('jams')
      .select('id, creator_id, title, starts_at')
      .eq('id', payload.jam_id)
      .single();

    if (jamError !== null || jam === null) {
      throw new Error(`Jam not found: ${payload.jam_id}`);
    }

    const input: CreateNotificationInput = {
      userId: payload.user_id,
      type: 'WAITLIST_PROMOTED',
      title: "You're in!",
      body: `A spot opened up in "${(jam as JamRow).title}": you've been moved from the waitlist to the participants.`,
      data: {
        jam_id: payload.jam_id,
        action: 'open_jam',
        navigation_target: `/jams/${payload.jam_id}`,
      },
    };

    const createdCount = await createNotificationsForUsers(supabase, [input]);

    return createJsonResponse({ success: true, created_count: createdCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-waitlist-promoted-notification error:', message);
    return createErrorResponse(message);
  }
});
