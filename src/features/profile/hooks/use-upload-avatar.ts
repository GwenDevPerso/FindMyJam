import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UploadAvatarInput } from '@/features/profile/types';
import { queryKeys } from '@/lib/query/keys';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (input: UploadAvatarInput) => {
      if (userId === null) {
        throw new Error('User must be authenticated to upload avatar');
      }

      return profileService.uploadAvatar(userId, input);
    },
    onSuccess: () => {
      if (userId !== null) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(userId) });
      }
    },
  });
}
