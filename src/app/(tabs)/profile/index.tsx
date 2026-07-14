import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Loading } from '@/components/feedback/loading';
import { ErrorState } from '@/components/layout/error-state';
import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { ProfileJamList, ProfileJamTabs } from '@/features/profile/components/profile-jam-list';
import { useProfile } from '@/features/profile/hooks/use-profile';
import type { ProfileJamTab } from '@/features/profile/types';
import { useAuthStore } from '@/store/auth.store';

export default function ProfileScreen(): React.JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const { logout, isLoggingOut, logoutError } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileJamTab>('created');

  const profileQuery = useProfile({
    userId,
    enabled: userId !== null,
  });

  if (userId === null) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState title="Not signed in" message="Sign in to view your profile." />
      </Screen>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <Loading size="large" fullScreen={true} />
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState
          title="Unable to load profile"
          message={profileQuery.error.message}
          onRetry={() => {
            void profileQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const profile = profileQuery.data;

  if (profile === undefined) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState title="Profile unavailable" message="Your profile could not be loaded." />
      </Screen>
    );
  }

  const handleJamPress = (jamId: string): void => {
    router.push(`/jams/${jamId}` as Href);
  };

  const handleEditPress = (): void => {
    router.push('/profile/edit');
  };

  const handleLogoutPress = (): void => {
    void logout();
  };

  return (
    <Screen scrollable={true} contentClassName="pb-8" withTabBarInset={true}>
      <ProfileHeader profile={profile} />

      <View className="mb-8 gap-2 flex-row justify-around">
        {logoutError !== null ? (
          <Text className="text-center text-sm text-destructive">{logoutError.message}</Text>
        ) : null}

        <Button
          label="Edit profile"
          variant="outline"
          size="md"
          isLoading={false}
          onPress={handleEditPress}
          className="mb-6"
        />

        <Button
          label="Se déconnecter"
          variant="destructive"
          size="md"
          isLoading={isLoggingOut}
          onPress={handleLogoutPress}
        />
      </View>

      <Text className="mb-2 text-lg font-semibold text-foreground">My jams</Text>

      <ProfileJamTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
      />

      <ProfileJamList userId={userId} activeTab={activeTab} onJamPress={handleJamPress} />


    </Screen>
  );
}
