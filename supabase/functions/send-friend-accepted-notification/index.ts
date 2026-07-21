import { createNotification } from '../_shared/notification-service.ts';
import { createServiceClient, createErrorResponse, createJsonResponse } from '../_shared/supabase.ts';
import type { ProfileRow } from '../_shared/types.ts';

type FriendAcceptedPayload = {
  friendship_id: string;
  requester_id: string;
  addressee_id: string;
};

async function getProfile(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', userId)
    .single();

  if (error !== null || data === null) {
    throw new Error(`Profile not found: ${userId}`);
  }

  return data;
}

async function isPreferenceEnabled(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('friend_acceptance')
    .eq('user_id', userId)
    .maybeSingle();

  if (error !== null) {
    throw new Error(`Failed to fetch preferences: ${error.message}`);
  }

  if (data === null) {
    return true;
  }

  return data.friend_acceptance === true;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const payload = (await request.json()) as FriendAcceptedPayload;
    const supabase = createServiceClient();

    const isEnabled = await isPreferenceEnabled(supabase, payload.requester_id);

    if (!isEnabled) {
      return createJsonResponse({ skipped: true, reason: 'preference_disabled' });
    }

    const addressee = await getProfile(supabase, payload.addressee_id);

    const notification = await createNotification(supabase, {
      userId: payload.requester_id,
      type: 'FRIEND_ACCEPTED',
      title: 'Friend request accepted',
      body: `${addressee.username} accepted your friend request`,
      imageUrl: addressee.avatar_url,
      data: {
        friendship_id: payload.friendship_id,
        friend_id: payload.addressee_id,
        profile_id: payload.addressee_id,
        action: 'open_friends',
        navigation_target: '/friends',
      },
    });

    return createJsonResponse({ success: true, notification_id: notification.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('send-friend-accepted-notification error:', message);
    return createErrorResponse(message);
  }
});
