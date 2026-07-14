import type { PostgrestError } from '@supabase/supabase-js';

import { AppError } from '@/lib/errors/app-error';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import { jamRepository } from '@/repositories/jam.repository';
import { participationRepository } from '@/repositories/participation.repository';

function assertNoError(error: PostgrestError | null): void {
  if (error !== null) {
    throw mapSupabaseError(error);
  }
}

export const participationService = {
  join: async (userId: string, jamId: string): Promise<void> => {
    const { data: jam, error: jamError } = await jamRepository.findById(jamId);
    assertNoError(jamError);

    if (jam === null) {
      throw new AppError('JAM_NOT_FOUND', 'Jam not found', 404);
    }

    if (jam.creator_id === userId) {
      throw new AppError('CREATOR_CANNOT_JOIN', 'Jam creator cannot join as participant', 400);
    }

    const { data: isParticipant, error: participantError } = await participationRepository.isParticipant(
      jamId,
      userId,
    );
    assertNoError(participantError);

    if (isParticipant) {
      throw new AppError('ALREADY_JOINED', 'You have already joined this jam', 409);
    }

    const { data: participantCount, error: countError } = await jamRepository.getParticipantCount(jamId);
    assertNoError(countError);

    if (participantCount >= jam.max_participants) {
      throw new AppError('JAM_FULL', 'This jam is full', 409);
    }

    const { error } = await participationRepository.join(jamId, userId);
    assertNoError(error);
  },

  leave: async (userId: string, jamId: string): Promise<void> => {
    const { data: isParticipant, error: participantError } = await participationRepository.isParticipant(
      jamId,
      userId,
    );
    assertNoError(participantError);

    if (!isParticipant) {
      throw new AppError('NOT_PARTICIPANT', 'You are not a participant of this jam', 404);
    }

    const { error } = await participationRepository.leave(jamId, userId);
    assertNoError(error);
  },
};
