import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarPicker } from '@/features/profile/components/avatar-picker';
import { MultiSelectChips } from '@/features/profile/components/multi-select-chips';
import { SkillLevelPicker } from '@/features/profile/components/skill-level-picker';
import { useReferenceInstruments } from '@/features/profile/hooks/use-reference-instruments';
import { useReferenceMusicStyles } from '@/features/profile/hooks/use-reference-music-styles';
import { useUpdateProfile } from '@/features/profile/hooks/use-update-profile';
import {
  updateProfileFormSchema,
  type UpdateProfileFormValues,
} from '@/features/profile/schemas/update-profile.schema';
import type { ProfileDetail } from '@/features/profile/types';

type EditProfileFormProps = {
  profile: ProfileDetail;
  onSuccess: () => void;
};

function toggleId(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((currentId) => currentId !== id);
  }

  return [...ids, id];
}

export function EditProfileForm({ profile, onSuccess }: EditProfileFormProps): React.JSX.Element {
  const { mutateAsync: updateProfile, isPending, error } = useUpdateProfile();
  const instrumentsQuery = useReferenceInstruments({ enabled: true });
  const musicStylesQuery = useReferenceMusicStyles({ enabled: true });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      username: profile.username,
      bio: profile.bio ?? '',
      skillLevel: profile.skillLevel,
      locationName: profile.locationName ?? '',
      latitude: profile.latitude,
      longitude: profile.longitude,
      instrumentIds: profile.instrumentIds,
      styleIds: profile.styleIds,
    },
  });

  const instrumentIds = watch('instrumentIds');
  const styleIds = watch('styleIds');
  const skillLevel = watch('skillLevel');

  const onSubmit = handleSubmit(async (values) => {
    await updateProfile({
      username: values.username,
      bio: values.bio.length === 0 ? null : values.bio,
      skillLevel: values.skillLevel,
      locationName: values.locationName.length === 0 ? null : values.locationName,
      latitude: values.latitude,
      longitude: values.longitude,
      instrumentIds: values.instrumentIds,
      styleIds: values.styleIds,
    });
    onSuccess();
  });

  const isReferenceLoading = instrumentsQuery.isLoading || musicStylesQuery.isLoading;

  return (
    <View className="gap-6 pb-8">
      <AvatarPicker avatarUrl={profile.avatarUrl} username={profile.username} size="xl" />

      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Username"
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.username?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="bio"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Bio"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            inputClassName="h-24 py-3"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.bio?.message}
          />
        )}
      />

      <SkillLevelPicker
        value={skillLevel}
        onChange={(value) => {
          setValue('skillLevel', value, { shouldValidate: true });
        }}
      />

      <Controller
        control={control}
        name="locationName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Location"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.locationName?.message}
          />
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="latitude"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Latitude"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={(text) => {
                  if (text.length === 0) {
                    onChange(null);
                    return;
                  }

                  const parsed = Number.parseFloat(text);
                  onChange(Number.isNaN(parsed) ? null : parsed);
                }}
                value={value === null ? '' : String(value)}
                error={errors.latitude?.message}
              />
            )}
          />
        </View>

        <View className="flex-1">
          <Controller
            control={control}
            name="longitude"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Longitude"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={(text) => {
                  if (text.length === 0) {
                    onChange(null);
                    return;
                  }

                  const parsed = Number.parseFloat(text);
                  onChange(Number.isNaN(parsed) ? null : parsed);
                }}
                value={value === null ? '' : String(value)}
                error={errors.longitude?.message}
              />
            )}
          />
        </View>
      </View>

      {isReferenceLoading ? (
        <Text className="text-sm text-muted-foreground">Loading instruments and styles…</Text>
      ) : (
        <>
          <MultiSelectChips
            label="Instruments"
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
        label="Save changes"
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
