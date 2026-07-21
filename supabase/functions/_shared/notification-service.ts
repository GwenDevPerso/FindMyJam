import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import type { CreateNotificationInput, DeviceRow } from './types.ts';

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) {
    return;
  }

  const chunks: ExpoPushMessage[][] = [];
  const chunkSize = 100;

  for (let index = 0; index < messages.length; index += chunkSize) {
    chunks.push(messages.slice(index, index + chunkSize));
  }

  for (const chunk of chunks) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expo push API error: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as { data: ExpoPushTicket[] };

    for (const ticket of payload.data) {
      if (ticket.status === 'error') {
        console.error('Expo push ticket error:', ticket.message, ticket.details);
      }
    }
  }
}

function serializeNotificationData(
  data: CreateNotificationInput['data'],
): Record<string, string> {
  if (data === undefined) {
    return {};
  }

  const serialized: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      serialized[key] = String(value);
    }
  }

  return serialized;
}

export async function getUserDevices(
  supabase: SupabaseClient,
  userId: string,
): Promise<DeviceRow[]> {
  const { data, error } = await supabase
    .from('devices')
    .select('id, user_id, expo_push_token, platform, app_version')
    .eq('user_id', userId);

  if (error !== null) {
    throw new Error(`Failed to fetch devices: ${error.message}`);
  }

  return data ?? [];
}

export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      image_url: input.imageUrl ?? null,
      data: input.data ?? {},
    })
    .select('id')
    .single();

  if (error !== null || data === null) {
    throw new Error(`Failed to create notification: ${error?.message ?? 'unknown error'}`);
  }

  const devices = await getUserDevices(supabase, input.userId);

  if (devices.length > 0) {
    const pushData = serializeNotificationData(input.data);

    await sendExpoPushNotifications(
      devices.map((device) => ({
        to: device.expo_push_token,
        title: input.title,
        body: input.body,
        data: {
          ...pushData,
          notification_id: data.id,
          type: input.type,
        },
        sound: 'default',
      })),
    );
  }

  return { id: data.id };
}

export async function createNotificationsForUsers(
  supabase: SupabaseClient,
  inputs: CreateNotificationInput[],
): Promise<number> {
  let createdCount = 0;

  for (const input of inputs) {
    await createNotification(supabase, input);
    createdCount += 1;
  }

  return createdCount;
}
