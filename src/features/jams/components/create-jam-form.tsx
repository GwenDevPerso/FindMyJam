import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationAutocompleteInput } from '@/features/location/components/location-autocomplete-input';
import { LocationPickerMap } from '@/features/location/components/location-picker-map';
import { MultiSelectChips } from '@/features/profile/components/multi-select-chips';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import { useCreateJam } from '@/features/jams/hooks/use-create-jam';
import {
  createJamFormSchema,
  DEFAULT_JAM_TIME,
  getDefaultJamDate,
  mapCreateJamFormToInput,
  type CreateJamFormValues,
} from '@/features/jams/schemas/create-jam-form.schema';
import type { SkillLevel } from '@/types/domain';
import { formatSkillLevel } from '@/utils/format';
import { Badge } from '@/components/ui/badge';

const SKILL_LEVELS: SkillLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
  'all_levels',
];

type CreateJamFormProps = {
  defaultLatitude: number;
  defaultLongitude: number;
  onSuccess: (jamId: string) => void;
};

function toggleId(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((currentId) => currentId !== id);
  }

  return [...ids, id];
}

export function CreateJamForm({
  defaultLatitude,
  defaultLongitude,
  onSuccess,
}: CreateJamFormProps): React.JSX.Element {
  const { mutateAsync: createJam, isPending, error } = useCreateJam();
  const instrumentsQuery = useReferenceInstruments({ enabled: true });
  const musicStylesQuery = useReferenceMusicStyles({ enabled: true });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateJamFormValues>({
    resolver: zodResolver(createJamFormSchema),
    defaultValues: {
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
    },
  });

  const instrumentIds = watch('instrumentIds');
  const styleIds = watch('styleIds');
  const skillLevel = watch('skillLevel');
  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const locationName = watch('locationName');

  const proximity = { latitude: defaultLatitude, longitude: defaultLongitude };

  const onSubmit = handleSubmit(async (values) => {
    const jam = await createJam(mapCreateJamFormToInput(values));
    onSuccess(jam.id);
  });

  const isReferenceLoading = instrumentsQuery.isLoading || musicStylesQuery.isLoading;

  return (
    <View className="gap-6 pb-8">
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Title"
            placeholder="Sunday jazz session"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.title?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Description"
            placeholder="What should musicians know?"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            inputClassName="h-24 py-3"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.description?.message}
          />
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Date"
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.date?.message}
              />
            )}
          />
        </View>

        <View className="flex-1">
          <Controller
            control={control}
            name="time"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Time"
                placeholder="20:00"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.time?.message}
              />
            )}
          />
        </View>
      </View>

      <LocationAutocompleteInput
        label="Location"
        placeholder="Search for a venue or address"
        value={locationName}
        proximity={proximity}
        error={errors.locationName?.message}
        onChangeText={(text) => {
          setValue('locationName', text, { shouldValidate: true });
        }}
        onSelect={(place) => {
          setValue('locationName', place.label, { shouldValidate: true });
          setValue('latitude', place.latitude, { shouldValidate: true });
          setValue('longitude', place.longitude, { shouldValidate: true });
        }}
      />

      <LocationPickerMap
        coordinates={{ latitude, longitude }}
        onCoordinatesChange={(coordinates) => {
          setValue('latitude', coordinates.latitude, { shouldValidate: true });
          setValue('longitude', coordinates.longitude, { shouldValidate: true });
        }}
        onLocationNameChange={(name) => {
          setValue('locationName', name, { shouldValidate: true });
        }}
      />

      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Skill level</Text>
        <View className="flex-row flex-wrap gap-2">
          {SKILL_LEVELS.map((level) => {
            const isSelected = skillLevel === level;

            return (
              <Pressable
                key={level}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setValue('skillLevel', level, { shouldValidate: true });
                }}>
                <Badge
                  label={formatSkillLevel(level)}
                  variant={isSelected ? 'solid' : 'outline'}
                  size="md"
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Controller
        control={control}
        name="maxParticipants"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Max participants"
            keyboardType="number-pad"
            onBlur={onBlur}
            onChangeText={(text) => {
              const parsed = Number.parseInt(text, 10);
              onChange(Number.isNaN(parsed) ? 2 : parsed);
            }}
            value={String(value)}
            error={errors.maxParticipants?.message}
          />
        )}
      />

      {isReferenceLoading ? (
        <Text className="text-sm text-muted-foreground">Loading instruments and styles…</Text>
      ) : (
        <>
          <MultiSelectChips
            label="Instruments sought"
            options={instrumentsQuery.data ?? []}
            selectedIds={instrumentIds}
            variant="instrument"
            onToggle={(id) => {
              setValue('instrumentIds', toggleId(instrumentIds, id), { shouldValidate: true });
            }}
          />

          <MultiSelectChips
            label="Music styles"
            options={musicStylesQuery.data ?? []}
            selectedIds={styleIds}
            variant="style"
            onToggle={(id) => {
              setValue('styleIds', toggleId(styleIds, id), { shouldValidate: true });
            }}
          />
        </>
      )}

      {error !== null ? <Text className="text-sm text-destructive">{error.message}</Text> : null}

      <Button
        label="Create jam"
        variant="primary"
        size="lg"
        isLoading={isPending}
        disabled={isReferenceLoading}
        onPress={() => {
          void onSubmit();
        }}
      />
    </View>
  );
}
