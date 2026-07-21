import { type Href, router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { FlatList, Text, View } from 'react-native';

import { Loading } from '@/components/feedback/loading';
import { EmptyState } from '@/components/layout/empty-state';
import { ErrorState } from '@/components/layout/error-state';
import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { NotificationCard } from '@/features/notifications/components/notification-card';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/hooks/use-notifications';
import type { Notification } from '@/features/notifications/types';
import { resolveNotificationHref } from '@/features/notifications/utils/resolve-notification-href';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth.store';

export function NotificationsScreen(): React.JSX.Element {
  const theme = useTheme();
  const userId = useAuthStore((state) => state.userId);

  const notificationsQuery = useNotifications({ enabled: userId !== null });
  const markAsReadMutation = useMarkNotificationRead();
  const markAllAsReadMutation = useMarkAllNotificationsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const notifications =
    notificationsQuery.data?.pages.flatMap((page) => page.notifications) ?? [];

  const handleNotificationPress = (notification: Notification): void => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    const href = resolveNotificationHref(notification);
    router.push(href as Href);
  };

  const handleMarkAllAsRead = (): void => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notification: Notification): void => {
    deleteNotificationMutation.mutate(notification.id);
  };

  const handleLoadMore = (): void => {
    if (notificationsQuery.hasNextPage && !notificationsQuery.isFetchingNextPage) {
      void notificationsQuery.fetchNextPage();
    }
  };

  if (notificationsQuery.isLoading) {
    return (
      <Screen scrollable={false} withTabBarInset={true}>
        <Loading size="large" fullScreen={false} />
      </Screen>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <Screen scrollable={false} withTabBarInset={true}>
        <ErrorState
          title="Unable to load notifications"
          message={notificationsQuery.error.message}
          onRetry={() => {
            void notificationsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} withTabBarInset={true}>
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Bell size={22} color={theme.primary} />
          <Text className="text-2xl font-bold text-foreground">Notifications</Text>
        </View>

        {notifications.length > 0 ? (
          <Button
            label="Mark all read"
            variant="ghost"
            size="sm"
            isLoading={markAllAsReadMutation.isPending}
            onPress={handleMarkAllAsRead}
          />
        ) : null}
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={40} color={theme.mutedForeground} />}
          title="No notifications yet"
          description="When something happens, you'll see it here."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={handleNotificationPress}
              onDelete={handleDelete}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            notificationsQuery.isFetchingNextPage ? (
              <View className="py-4">
                <Loading size="small" fullScreen={false} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
