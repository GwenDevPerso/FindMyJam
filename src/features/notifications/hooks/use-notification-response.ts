import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { resolvePushHref } from '@/features/notifications/utils/resolve-notification-href';

type UseNotificationResponseOptions = {
  enabled: boolean;
};

/**
 * Opens the screen of a push notification the user tapped: while the app runs, and once signed in for the tap
 * that launched the app. Each response is handled once. Push notifications do not exist on web, where these
 * APIs are unavailable.
 */
export function useNotificationResponse({ enabled }: UseNotificationResponseOptions): void {
  const handledIdentifiers = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') {
      return;
    }

    const open = (response: Notifications.NotificationResponse): void => {
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return;
      }

      const identifier = response.notification.request.identifier;

      if (handledIdentifiers.current.has(identifier)) {
        return;
      }

      handledIdentifiers.current.add(identifier);

      const href = resolvePushHref(response.notification.request.content.data);

      if (href !== null) {
        router.push(href);
      }
    };

    const lastResponse = Notifications.getLastNotificationResponse();

    if (lastResponse !== null) {
      open(lastResponse);
      Notifications.clearLastNotificationResponse();
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(open);

    return () => {
      subscription.remove();
    };
  }, [enabled]);
}
