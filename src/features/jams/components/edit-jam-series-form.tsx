import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { JamForm } from '@/features/jams/components/jam-form';
import { useUpdateJamSeries } from '@/features/jams/hooks/use-update-jam-series';
import {
  mapJamFormToSeriesInput,
  mapJamToFormValues,
  type CreateJamFormValues,
} from '@/features/jams/schemas/create-jam-form.schema';
import type { Jam } from '@/types/domain';

type EditJamSeriesFormProps = {
  /** The date the creator opened; its values prefill the template. */
  jam: Jam;
  seriesId: string;
  /** Current end date of the series (`YYYY-MM-DD`); null when it never ends. */
  endsOn: string | null;
  onSuccess: () => void;
};

/** Edits every upcoming date of a series. The day cannot change, only the time and the other fields. */
export function EditJamSeriesForm({
  jam,
  seriesId,
  endsOn,
  onSuccess,
}: EditJamSeriesFormProps): React.JSX.Element {
  const { mutateAsync: updateJamSeries, isPending, error } = useUpdateJamSeries();

  const handleSubmit = async (values: CreateJamFormValues): Promise<void> => {
    await updateJamSeries({ seriesId, input: mapJamFormToSeriesInput(values) });
    onSuccess();
  };

  return (
    <View className="gap-4">
      <Text className="text-sm text-muted-foreground">
        Changes apply to all upcoming dates. To move the series to another day, delete it and create a new one.
      </Text>

      <JamForm
        defaultValues={{ ...mapJamToFormValues(jam), endsOn: endsOn ?? '' }}
        submitLabel="Save all upcoming dates"
        isPending={isPending}
        error={error}
        showRecurrence={false}
        showEndsOn={true}
        lockDate={true}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
