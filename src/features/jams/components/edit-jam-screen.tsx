import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Loading } from '@/components/feedback/loading';
import { ErrorState } from '@/components/layout/error-state';
import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { EditJamForm } from '@/features/jams/components/edit-jam-form';
import { EditJamSeriesForm } from '@/features/jams/components/edit-jam-series-form';
import { useJamDetail } from '@/features/jams/hooks/use-jam-detail';

type EditJamScreenProps = {
  jamId: string;
};

/** Which dates of a series the edit applies to. */
type EditScope = 'occurrence' | 'series';

/**
 * Edit form of a jam, reserved to its creator. For a date of a series, the creator first chooses between this
 * date only and all upcoming dates.
 */
export function EditJamScreen({ jamId }: EditJamScreenProps): React.JSX.Element {
  const jamQuery = useJamDetail({ jamId, enabled: jamId.length > 0 });
  const [scope, setScope] = useState<EditScope | null>(null);

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

  if (jam.seriesId !== null && scope === null) {
    return (
      <Screen scrollable={false} withTabBarInset={false} contentClassName="gap-4 pt-4">
        <Text className="text-lg font-bold text-foreground">Which dates do you want to edit?</Text>
        <View className="gap-3">
          <Button
            label="This date only"
            variant="outline"
            size="lg"
            isLoading={false}
            onPress={() => {
              setScope('occurrence');
            }}
          />
          <Button
            label="All upcoming dates"
            variant="outline"
            size="lg"
            isLoading={false}
            onPress={() => {
              setScope('series');
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable={true} withTabBarInset={false}>
      {jam.seriesId !== null && scope === 'series' ? (
        <EditJamSeriesForm jam={jam} seriesId={jam.seriesId} onSuccess={handleSuccess} />
      ) : (
        <EditJamForm jam={jam} onSuccess={handleSuccess} />
      )}
    </Screen>
  );
}
