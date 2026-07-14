import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateProfileInput } from '@/features/profile/types';
import { queryKeys } from '@/lib/query/keys';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => {
      if (userId === null) {
        throw new Error('User must be authenticated to update profile');
      }

      return profileService.update(userId, input);
    },
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(profile.id) });
    },
  });
}
