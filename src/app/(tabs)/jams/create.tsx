import { type Href, router } from 'expo-router';

import { ErrorState } from '@/components/layout/error-state';
import { Loading } from '@/components/feedback/loading';
import { Screen } from '@/components/layout/screen';
import { CreateJamForm } from '@/features/jams/components/create-jam-form';
import { useUserLocation } from '@/features/map/hooks/use-user-location';
import { useAuthStore } from '@/store/auth.store';

export default function CreateJamScreen(): React.JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const locationQuery = useUserLocation({ enabled: userId !== null });

  const latitude = locationQuery.data?.latitude ?? 48.8566;
  const longitude = locationQuery.data?.longitude ?? 2.3522;

  const handleSuccess = (jamId: string): void => {
    router.replace(`/jams/${jamId}` as Href);
  };

  if (userId === null) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState title="Not signed in" message="Sign in to create a jam." />
      </Screen>
    );
  }

  if (locationQuery.isLoading) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <Loading message="Getting your location…" size="large" fullScreen={true} />
      </Screen>
    );
  }

  return (
    <Screen scrollable={true} withTabBarInset={false}>
      <CreateJamForm
        defaultLatitude={latitude}
        defaultLongitude={longitude}
        onSuccess={handleSuccess}
      />
    </Screen>
  );
}
