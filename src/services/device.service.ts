import type { PostgrestError } from '@supabase/supabase-js';

import type { Device, RegisterDeviceInput } from '@/features/notifications/types';
import { registerDeviceSchema } from '@/features/notifications/schemas/notification.schema';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import type { DeviceRow } from '@/lib/supabase/types';
import { deviceRepository } from '@/repositories/notification.repository';

function assertNoError(error: PostgrestError | null): void {
  if (error !== null) {
    throw mapSupabaseError(error);
  }
}

function mapDeviceRow(row: DeviceRow): Device {
  return {
    id: row.id,
    userId: row.user_id,
    expoPushToken: row.expo_push_token,
    platform: row.platform,
    appVersion: row.app_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const deviceService = {
  register: async (userId: string, input: RegisterDeviceInput): Promise<Device> => {
    const validated = registerDeviceSchema.parse(input);

    const { data: existing, error: existingError } = await deviceRepository.findByUserAndToken(
      userId,
      validated.expoPushToken,
    );
    assertNoError(existingError);

    if (existing !== null) {
      const { data, error } = await deviceRepository.update(existing.id, {
        platform: validated.platform,
        app_version: validated.appVersion,
      });
      assertNoError(error);

      return mapDeviceRow(data);
    }

    const { data, error } = await deviceRepository.create({
      user_id: userId,
      expo_push_token: validated.expoPushToken,
      platform: validated.platform,
      app_version: validated.appVersion,
    });
    assertNoError(error);

    return mapDeviceRow(data);
  },

  unregister: async (userId: string, expoPushToken: string): Promise<void> => {
    const { error } = await deviceRepository.deleteByToken(userId, expoPushToken);
    assertNoError(error);
  },
};
