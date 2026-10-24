import { JamForm } from '@/features/jams/components/jam-form';
import { useUpdateJam } from '@/features/jams/hooks/use-update-jam';
import {
  mapJamFormToUpdateInput,
  mapJamToFormValues,
  type CreateJamFormValues,
} from '@/features/jams/schemas/create-jam-form.schema';
import type { Jam } from '@/types/domain';

type EditJamFormProps = {
  jam: Jam;
  onSuccess: () => void;
};

/** Edits one jam: a one-off jam, or a single date of a series. */
export function EditJamForm({ jam, onSuccess }: EditJamFormProps): React.JSX.Element {
  const { mutateAsync: updateJam, isPending, error } = useUpdateJam();

  const handleSubmit = async (values: CreateJamFormValues): Promise<void> => {
    await updateJam({ jamId: jam.id, input: mapJamFormToUpdateInput(values) });
    onSuccess();
  };

  return (
    <JamForm
      defaultValues={mapJamToFormValues(jam)}
      submitLabel="Save changes"
      isPending={isPending}
      error={error}
      showRecurrence={false}
      lockDate={false}
      onSubmit={handleSubmit}
    />
  );
}
