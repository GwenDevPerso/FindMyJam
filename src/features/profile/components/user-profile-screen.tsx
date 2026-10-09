import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Loading } from '@/components/feedback/loading';
import { ErrorState } from '@/components/layout/error-state';
import { Screen } from '@/components/layout/screen';
import { Routes } from '@/constants/routes';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { ProfileJamList, ProfileJamTabs } from '@/features/profile/components/profile-jam-list';
import { useProfile } from '@/features/profile/hooks/use-profile';
import type { ProfileJamTab } from '@/features/profile/types';

type UserProfileScreenProps = {
  userId: string;
};

/** Read-only profile of any user (the signed-in user's own profile lives in the `profile` tab). */
export function UserProfileScreen({ userId }: UserProfileScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ProfileJamTab>('created');

  const profileQuery = useProfile({
    userId,
    enabled: userId.length > 0,
  });

  if (profileQuery.isLoading) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <Loading message="Loading profile…" size="large" fullScreen={true} />
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
        <ErrorState title="Profile not found" message="This musician may no longer be on Jam Finder." />
      </Screen>
    );
  }

  const handleJamPress = (jamId: string): void => {
    router.push(Routes.jamDetail(jamId) as Href);
  };

  return (
    <Screen scrollable={true} contentClassName="pb-8" withTabBarInset={true}>
      <ProfileHeader profile={profile} />

      <Text className="mb-2 text-lg font-semibold text-foreground">Jams</Text>

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
