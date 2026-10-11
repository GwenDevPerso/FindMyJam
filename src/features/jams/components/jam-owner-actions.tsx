import { type Href, router } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Routes } from '@/constants/routes';
import { useDeleteJam } from '@/features/jams/hooks/use-delete-jam';

type JamOwnerActionsProps = {
  jamId: string;
  jamTitle: string;
};

/** Edit and delete actions of a jam; render it only for the jam's creator. */
export function JamOwnerActions({ jamId, jamTitle }: JamOwnerActionsProps): React.JSX.Element {
  const deleteJam = useDeleteJam();

  const leaveScreen = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(Routes.jamsAll as Href);
  };

  const confirmDelete = (): void => {
    Alert.alert(
      'Delete jam',
      `Delete "${jamTitle}"? Registered musicians will be notified. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteJam.mutate(jamId, { onSuccess: leaveScreen });
          },
        },
      ],
    );
  };

  return (
    <View className="gap-3">
      <Button
        label="Edit jam"
        variant="outline"
        size="lg"
        isLoading={false}
        disabled={deleteJam.isPending}
        onPress={() => {
          router.push(Routes.jamEdit(jamId) as Href);
        }}
      />

      <Button
        label="Delete jam"
        variant="destructive"
        size="lg"
        isLoading={deleteJam.isPending}
        onPress={confirmDelete}
      />

      {deleteJam.error !== null ? (
        <Text className="text-sm text-destructive">{deleteJam.error.message}</Text>
      ) : null}
    </View>
  );
}
