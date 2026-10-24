import { JamForm } from '@/features/jams/components/jam-form';
import { useCreateJam } from '@/features/jams/hooks/use-create-jam';
import {
  DEFAULT_JAM_TIME,
  getDefaultJamDate,
  mapCreateJamFormToInput,
  type CreateJamFormValues,
} from '@/features/jams/schemas/create-jam-form.schema';

type CreateJamFormProps = {
  defaultLatitude: number;
  defaultLongitude: number;
  onSuccess: (jamId: string) => void;
};

export function CreateJamForm({
  defaultLatitude,
  defaultLongitude,
  onSuccess,
}: CreateJamFormProps): React.JSX.Element {
  const { mutateAsync: createJam, isPending, error } = useCreateJam();

  const handleSubmit = async (values: CreateJamFormValues): Promise<void> => {
    const jam = await createJam(mapCreateJamFormToInput(values));
    onSuccess(jam.id);
  };

  return (
    <JamForm
      defaultValues={{
        title: '',
        description: '',
        date: getDefaultJamDate(),
        time: DEFAULT_JAM_TIME,
        locationName: '',
        latitude: defaultLatitude,
        longitude: defaultLongitude,
        skillLevel: 'all_levels',
        maxParticipants: 10,
        instrumentIds: [],
        styleIds: [],
        recurrence: 'none',
      }}
      submitLabel="Create jam"
      isPending={isPending}
      error={error}
      showRecurrence={true}
      lockDate={false}
      onSubmit={handleSubmit}
    />
  );
}
