import { type Href, router } from 'expo-router';

import { Loading } from '@/components/feedback/loading';
import { ErrorState } from '@/components/layout/error-state';
import { Screen } from '@/components/layout/screen';
import { Routes } from '@/constants/routes';
import { EditJamForm } from '@/features/jams/components/edit-jam-form';
import { useJamDetail } from '@/features/jams/hooks/use-jam-detail';

type EditJamScreenProps = {
  jamId: string;
};

/** Edit form of a jam, reserved to its creator. */
export function EditJamScreen({ jamId }: EditJamScreenProps): React.JSX.Element {
  const jamQuery = useJamDetail({ jamId, enabled: jamId.length > 0 });

  if (jamQuery.isLoading) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <Loading message="Loading jam…" size="large" fullScreen={true} />
      </Screen>
    );
  }

  if (jamQuery.isError) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState
          title="Unable to load jam"
          message={jamQuery.error.message}
          onRetry={() => {
            void jamQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const jam = jamQuery.data;

  if (jam === undefined) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState title="Jam not found" message="This jam may have been removed." />
      </Screen>
    );
  }

  if (!jam.isCreator) {
    return (
      <Screen scrollable={false} withTabBarInset={false}>
        <ErrorState
          title="Only the creator can edit this jam"
          message="You can still see its details and participants."
        />
      </Screen>
    );
  }

  const handleSuccess = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(Routes.jamDetail(jam.id) as Href);
  };

  return (
    <Screen scrollable={true} withTabBarInset={false}>
      <EditJamForm jam={jam} onSuccess={handleSuccess} />
    </Screen>
  );
}
