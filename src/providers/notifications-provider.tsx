import { type ReactNode } from 'react';

import { useNotificationResponse } from '@/features/notifications/hooks/use-notification-response';
import { useNotificationsRealtime } from '@/features/notifications/hooks/use-notifications-realtime';
import { useRegisterDevice } from '@/features/notifications/hooks/use-register-device';
import { useAuthStore } from '@/store/auth.store';

type NotificationsProviderProps = {
  children: ReactNode;
};

export function NotificationsProvider({ children }: NotificationsProviderProps): React.JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const isAuthenticated = userId !== null;

  useRegisterDevice({ enabled: isAuthenticated });
  useNotificationsRealtime({ enabled: isAuthenticated });
  useNotificationResponse({ enabled: isAuthenticated });

  return <>{children}</>;
}
