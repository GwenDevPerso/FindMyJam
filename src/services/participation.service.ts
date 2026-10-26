import type { PostgrestError } from '@supabase/supabase-js';

import type { JamWaitlistStatus } from '@/features/jams/types';
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

  getWaitlistStatus: async (userId: string, jamId: string): Promise<JamWaitlistStatus> => {
    const { data, error } = await participationRepository.findWaitlist(jamId);
    assertNoError(error);

    const index = data.findIndex((row) => row.user_id === userId);

    return { position: index === -1 ? null : index + 1, size: data.length };
  },

  /** A full jam only: when a participant leaves, the database promotes the first person waiting. */
  joinWaitlist: async (userId: string, jamId: string): Promise<void> => {
    const { data: jam, error: jamError } = await jamRepository.findById(jamId);
    assertNoError(jamError);

    if (jam === null) {
      throw new AppError('JAM_NOT_FOUND', 'Jam not found', 404);
    }

    if (jam.creator_id === userId) {
      throw new AppError('CREATOR_CANNOT_JOIN', 'Jam creator cannot join the waitlist', 400);
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

    if (participantCount < jam.max_participants) {
      throw new AppError('JAM_NOT_FULL', 'This jam still has room: join it directly', 409);
    }

    const { data: waitlist, error: waitlistError } = await participationRepository.findWaitlist(jamId);
    assertNoError(waitlistError);

    if (waitlist.some((row) => row.user_id === userId)) {
      throw new AppError('ALREADY_ON_WAITLIST', 'You are already on the waitlist', 409);
    }

    const { error } = await participationRepository.joinWaitlist(jamId, userId);
    assertNoError(error);
  },

  leaveWaitlist: async (userId: string, jamId: string): Promise<void> => {
    const { data: waitlist, error: waitlistError } = await participationRepository.findWaitlist(jamId);
    assertNoError(waitlistError);

    if (!waitlist.some((row) => row.user_id === userId)) {
      throw new AppError('NOT_ON_WAITLIST', 'You are not on the waitlist', 404);
    }

    const { error } = await participationRepository.leaveWaitlist(jamId, userId);
    assertNoError(error);
  },
};
