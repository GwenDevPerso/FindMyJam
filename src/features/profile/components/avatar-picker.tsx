import * as ImagePicker from 'expo-image-picker';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { useUploadAvatar } from '@/features/profile/hooks/use-upload-avatar';
import { cn } from '@/utils/cn';

type AvatarPickerProps = {
  avatarUrl: string | null;
  username: string;
  size: 'lg' | 'xl';
  className?: string;
};

function mapMimeType(mimeType: string | undefined): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp') {
    return mimeType;
  }

  return null;
}

export function AvatarPicker({
  avatarUrl,
  username,
  size,
  className,
}: AvatarPickerProps): React.JSX.Element {
  const { mutateAsync: uploadAvatar, isPending, error } = useUploadAvatar();

  const handlePickImage = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const mimeType = mapMimeType(asset.mimeType ?? undefined);

    if (mimeType === null) {
      return;
    }

    if (asset.fileSize === undefined || asset.fileSize === null) {
      return;
    }

    await uploadAvatar({
      uri: asset.uri,
      mimeType,
      fileSize: asset.fileSize,
    });
  };

  return (
    <View className={cn('items-center gap-2', className)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        disabled={isPending}
        onPress={() => {
          void handlePickImage();
        }}>
        <Avatar source={avatarUrl} fallback={username} size={size} />
      </Pressable>

      <Text className="text-sm text-primary">
        {isPending ? 'Uploading…' : 'Change photo'}
      </Text>

      {error !== null ? (
        <Text className="text-center text-sm text-destructive">{error.message}</Text>
      ) : null}
    </View>
  );
}
