import type { PostgrestError } from '@supabase/supabase-js';

import type {
  ProfileDetail,
  UpdateProfileInput,
  UploadAvatarInput,
} from '@/features/profile/types';
import { updateProfileSchema } from '@/features/profile/schemas/update-profile.schema';
import { uploadAvatarSchema } from '@/features/profile/schemas/upload-avatar.schema';
import { AppError } from '@/lib/errors/app-error';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import type { ProfileRow } from '@/lib/supabase/types';
import type { Instrument, Jam, MusicStyle, Profile } from '@/types/domain';
import { jamRepository } from '@/repositories/jam.repository';
import { profileRepository } from '@/repositories/profile.repository';
import { referenceRepository } from '@/repositories/reference.repository';

function assertNoError(error: PostgrestError | { message: string; name: 'StorageError' } | null): void {
  if (error === null) {
    return;
  }

  if (!('code' in error)) {
    throw new AppError('INVALID_AVATAR', error.message, 400);
  }

  throw mapSupabaseError(error);
}

function assertOwnProfile(userId: string, profileUserId: string): void {
  if (userId !== profileUserId) {
    throw new AppError('UNAUTHORIZED', 'You can only edit your own profile', 403);
  }
}

function mapProfileRow(
  row: ProfileRow,
  instrumentIds: string[],
  styleIds: string[],
): Profile {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    skillLevel: row.skill_level,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    instrumentIds,
    styleIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInstrumentRow(row: { id: string; name: string; slug: string }): Instrument {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

function mapMusicStyleRow(row: { id: string; name: string; slug: string }): MusicStyle {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

async function enrichJamRows(rows: Awaited<ReturnType<typeof jamRepository.findByCreatorId>>['data']): Promise<Jam[]> {
  return Promise.all(
    rows.map(async (row) => {
      const [participantCountResult, instrumentIdsResult, styleIdsResult] = await Promise.all([
        jamRepository.getParticipantCount(row.id),
        jamRepository.getInstrumentIds(row.id),
        jamRepository.getStyleIds(row.id),
      ]);

      assertNoError(participantCountResult.error);
      assertNoError(instrumentIdsResult.error);
      assertNoError(styleIdsResult.error);

      return {
        id: row.id,
        creatorId: row.creator_id,
        title: row.title,
        description: row.description,
        startsAt: row.starts_at,
        locationName: row.location_name,
        latitude: row.latitude,
        longitude: row.longitude,
        skillLevel: row.skill_level,
        maxParticipants: row.max_participants,
        participantCount: participantCountResult.data,
        distanceMeters: null,
        instrumentIds: instrumentIdsResult.data,
        styleIds: styleIdsResult.data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }),
  );
}

async function fetchImageArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new AppError('INVALID_AVATAR', 'Failed to read the selected image', 400);
  }

  return response.arrayBuffer();
}

export const profileService = {
  getById: async (userId: string): Promise<ProfileDetail> => {
    const [profileResult, instrumentIdsResult, styleIdsResult] = await Promise.all([
      profileRepository.findById(userId),
      profileRepository.getInstrumentIds(userId),
      profileRepository.getStyleIds(userId),
    ]);

    assertNoError(profileResult.error);
    assertNoError(instrumentIdsResult.error);
    assertNoError(styleIdsResult.error);

    if (profileResult.data === null) {
      throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }

    const profile = mapProfileRow(profileResult.data, instrumentIdsResult.data, styleIdsResult.data);

    const [instrumentsResult, stylesResult] = await Promise.all([
      referenceRepository.getInstruments(),
      referenceRepository.getMusicStyles(),
    ]);

    assertNoError(instrumentsResult.error);
    assertNoError(stylesResult.error);

    const instruments = instrumentsResult.data
      .filter((instrument) => profile.instrumentIds.includes(instrument.id))
      .map(mapInstrumentRow);

    const musicStyles = stylesResult.data
      .filter((style) => profile.styleIds.includes(style.id))
      .map(mapMusicStyleRow);

    return {
      ...profile,
      instruments,
      musicStyles,
    };
  },

  update: async (userId: string, input: UpdateProfileInput): Promise<ProfileDetail> => {
    assertOwnProfile(userId, userId);

    const validated = updateProfileSchema.parse(input);

    const { error: updateError } = await profileRepository.update(userId, {
      username: validated.username,
      bio: validated.bio,
      skill_level: validated.skillLevel,
      location_name: validated.locationName,
      latitude: validated.latitude,
      longitude: validated.longitude,
    });
    assertNoError(updateError);

    const { error: instrumentsError } = await profileRepository.setInstruments(
      userId,
      validated.instrumentIds,
    );
    assertNoError(instrumentsError);

    const { error: stylesError } = await profileRepository.setStyles(userId, validated.styleIds);
    assertNoError(stylesError);

    return profileService.getById(userId);
  },

  uploadAvatar: async (userId: string, input: UploadAvatarInput): Promise<string> => {
    assertOwnProfile(userId, userId);

    const validated = uploadAvatarSchema.parse(input);
    const fileData = await fetchImageArrayBuffer(validated.uri);

    const { data, error } = await profileRepository.uploadAvatar({
      userId,
      fileData,
      contentType: validated.mimeType,
    });
    assertNoError(error);

    return data;
  },

  getCreatedJams: async (userId: string): Promise<Jam[]> => {
    const { data, error } = await jamRepository.findByCreatorId(userId);
    assertNoError(error);

    return enrichJamRows(data);
  },

  getParticipatedJams: async (userId: string): Promise<Jam[]> => {
    const { data, error } = await jamRepository.findParticipatedByUserId(userId);
    assertNoError(error);

    return enrichJamRows(data);
  },

  getReferenceInstruments: async (): Promise<Instrument[]> => {
    const { data, error } = await referenceRepository.getInstruments();
    assertNoError(error);

    return data.map(mapInstrumentRow);
  },

  getReferenceMusicStyles: async (): Promise<MusicStyle[]> => {
    const { data, error } = await referenceRepository.getMusicStyles();
    assertNoError(error);

    return data.map(mapMusicStyleRow);
  },
};
