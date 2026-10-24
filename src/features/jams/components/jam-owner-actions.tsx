import { type Href, router } from 'expo-router';
import { Alert, type AlertButton, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { useDeleteJam } from '@/features/jams/hooks/use-delete-jam';
import { useDeleteJamSeries } from '@/features/jams/hooks/use-delete-jam-series';

type JamOwnerActionsProps = {
  jamId: string;
  /** Series of the jam; when set, the deletion offers this date only or all upcoming dates. */
  seriesId: string | null;
  jamTitle: string;
};

/** Edit and delete actions of a jam; render it only for the jam's creator. */
export function JamOwnerActions({ jamId, seriesId, jamTitle }: JamOwnerActionsProps): React.JSX.Element {
  const deleteJam = useDeleteJam();
  const deleteJamSeries = useDeleteJamSeries();

  const isDeleting = deleteJam.isPending || deleteJamSeries.isPending;
  const deleteError = deleteJam.error ?? deleteJamSeries.error;

  const leaveScreen = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(Routes.jamsAll as Href);
  };

  const deleteThisDate = (): void => {
    deleteJam.mutate(jamId, { onSuccess: leaveScreen });
  };

  const confirmDelete = (): void => {
    const buttons: AlertButton[] =
      seriesId === null
        ? [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: deleteThisDate },
          ]
        : [
            { text: 'Cancel', style: 'cancel' },
            { text: 'This date', style: 'destructive', onPress: deleteThisDate },
            {
              text: 'All upcoming dates',
              style: 'destructive',
              onPress: () => {
                deleteJamSeries.mutate(seriesId, { onSuccess: leaveScreen });
              },
            },
          ];

    Alert.alert(
      'Delete jam',
      `Delete "${jamTitle}"? Registered musicians will be notified. This cannot be undone.`,
      buttons,
    );
  };

  return (
    <View className="gap-3">
      <Button
        label="Edit jam"
        variant="outline"
        size="lg"
        isLoading={false}
        disabled={isDeleting}
        onPress={() => {
          router.push(Routes.jamEdit(jamId) as Href);
        }}
      />

      <Button
        label="Delete jam"
        variant="destructive"
        size="lg"
        isLoading={isDeleting}
        onPress={confirmDelete}
      />

      {deleteError !== null ? <Text className="text-sm text-destructive">{deleteError.message}</Text> : null}
    </View>
  );
}
