import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import type { DevicePlatform } from '@/features/notifications/types';
import { deviceService } from '@/services/device.service';
import { useAuthStore } from '@/store/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function resolvePlatform(): DevicePlatform {
  if (Platform.OS === 'ios') {
    return 'ios';
  }

  if (Platform.OS === 'android') {
    return 'android';
  }

  return 'web';
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId !== undefined ? { projectId } : undefined,
  );

  return token.data;
}

type UseRegisterDeviceOptions = {
  enabled: boolean;
};

export function useRegisterDevice({ enabled }: UseRegisterDeviceOptions): void {
  const userId = useAuthStore((state) => state.userId);

  useEffect(() => {
    if (!enabled || userId === null) {
      return;
    }

    let isMounted = true;

    const register = async (): Promise<void> => {
      try {
        const expoPushToken = await registerForPushNotifications();

        if (!isMounted || expoPushToken === null) {
          return;
        }

        await deviceService.register(userId, {
          expoPushToken,
          platform: resolvePlatform(),
          appVersion: Constants.expoConfig?.version ?? null,
        });
      } catch (error) {
        console.error('Failed to register device for push notifications:', error);
      }
    };

    void register();

    return () => {
      isMounted = false;
    };
  }, [enabled, userId]);
}
