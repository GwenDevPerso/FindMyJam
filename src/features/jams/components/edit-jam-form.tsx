import { JamForm } from '@/features/jams/components/jam-form';
import { useUpdateJam } from '@/features/jams/hooks/use-update-jam';
import {
  mapCreateJamFormToInput,
  mapJamToFormValues,
  type CreateJamFormValues,
} from '@/features/jams/schemas/create-jam-form.schema';
import type { Jam } from '@/types/domain';

type EditJamFormProps = {
  jam: Jam;
  onSuccess: () => void;
};

export function EditJamForm({ jam, onSuccess }: EditJamFormProps): React.JSX.Element {
  const { mutateAsync: updateJam, isPending, error } = useUpdateJam();

  const handleSubmit = async (values: CreateJamFormValues): Promise<void> => {
    await updateJam({ jamId: jam.id, input: mapCreateJamFormToInput(values) });
    onSuccess();
  };

  return (
    <JamForm
      defaultValues={mapJamToFormValues(jam)}
      submitLabel="Save changes"
      isPending={isPending}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
