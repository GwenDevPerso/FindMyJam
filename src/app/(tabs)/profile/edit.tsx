import { router } from 'expo-router';

import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { Screen } from '@/components/layout/screen';
import { EditProfileForm } from '@/features/profile/components/edit-profile-form';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useAuthStore } from '@/store/auth.store';

export default function EditProfileScreen(): React.JSX.Element {
  const userId = useAuthStore((state) => state.userId);

  const profileQuery = useProfile({
    userId,
    enabled: userId !== null,
  });

  const handleSuccess = (): void => {
    router.back();
  };

  if (userId === null) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState title="Not signed in" message="Sign in to edit your profile." />
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

  return (
    <Screen scrollable={true} withTabBarInset={false}>
      <EditProfileForm profile={profile} onSuccess={handleSuccess} />
    </Screen>
  );
}
