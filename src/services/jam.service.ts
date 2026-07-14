import type { PostgrestError } from '@supabase/supabase-js';

import type {
  CreateJamInput,
  JamDetail,
  JamListCursor,
  JamListFilters,
  JamListResult,
  UpdateJamInput,
} from '@/features/jams/types';
import { createJamSchema } from '@/features/jams/schemas/create-jam.schema';
import { updateJamSchema } from '@/features/jams/schemas/update-jam.schema';
import { AppError } from '@/lib/errors/app-error';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import type { JamRow, SearchJamRow } from '@/lib/supabase/types';
import type { Jam, JamParticipant } from '@/types/domain';
import { jamRepository } from '@/repositories/jam.repository';
import { participationRepository } from '@/repositories/participation.repository';

const DEFAULT_LIST_LIMIT = 20;
const DEFAULT_RADIUS_METERS = 50_000;

function assertNoError(error: PostgrestError | null): void {
  if (error !== null) {
    throw mapSupabaseError(error);
  }
}

function mapJamRow(
  row: JamRow,
  participantCount: number,
  distanceMeters: number | null,
  instrumentIds: string[],
  styleIds: string[],
): Jam {
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
    participantCount,
    distanceMeters,
    instrumentIds,
    styleIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSearchJamRow(row: SearchJamRow, instrumentIds: string[], styleIds: string[]): Jam {
  return mapJamRow(row, row.participant_count, row.distance_meters, instrumentIds, styleIds);
}

function buildNextCursor(jams: SearchJamRow[], limit: number): JamListCursor | null {
  if (jams.length < limit) {
    return null;
  }

  const lastJam = jams[jams.length - 1];

  return {
    distanceMeters: lastJam.distance_meters,
    startsAt: lastJam.starts_at,
    id: lastJam.id,
  };
}

async function enrichJamRow(row: JamRow): Promise<Jam> {
  const [participantCountResult, instrumentIdsResult, styleIdsResult] = await Promise.all([
    jamRepository.getParticipantCount(row.id),
    jamRepository.getInstrumentIds(row.id),
    jamRepository.getStyleIds(row.id),
  ]);

  assertNoError(participantCountResult.error);
  assertNoError(instrumentIdsResult.error);
  assertNoError(styleIdsResult.error);

  return mapJamRow(
    row,
    participantCountResult.data,
    null,
    instrumentIdsResult.data,
    styleIdsResult.data,
  );
}

async function enrichSearchJamRows(rows: SearchJamRow[]): Promise<Jam[]> {
  return Promise.all(
    rows.map(async (row) => {
      const [instrumentIdsResult, styleIdsResult] = await Promise.all([
        jamRepository.getInstrumentIds(row.id),
        jamRepository.getStyleIds(row.id),
      ]);

      assertNoError(instrumentIdsResult.error);
      assertNoError(styleIdsResult.error);

      return mapSearchJamRow(row, instrumentIdsResult.data, styleIdsResult.data);
    }),
  );
}

function assertCreator(jam: JamRow, userId: string): void {
  if (jam.creator_id !== userId) {
    throw new AppError('NOT_CREATOR', 'Only the jam creator can perform this action', 403);
  }
}

export const jamService = {
  list: async (filters?: Partial<JamListFilters>): Promise<JamListResult> => {
    const resolvedFilters: JamListFilters = {
      latitude: filters?.latitude ?? 48.8566,
      longitude: filters?.longitude ?? 2.3522,
      radiusMeters: filters?.radiusMeters ?? DEFAULT_RADIUS_METERS,
      instrumentIds: filters?.instrumentIds ?? [],
      styleIds: filters?.styleIds ?? [],
      startsAfter: filters?.startsAfter ?? new Date().toISOString(),
      startsBefore: filters?.startsBefore ?? null,
      limit: filters?.limit ?? DEFAULT_LIST_LIMIT,
      cursor: filters?.cursor ?? null,
    };

    const { data, error } = await jamRepository.search(resolvedFilters);
    assertNoError(error);

    const jams = await enrichSearchJamRows(data);

    return {
      jams,
      nextCursor: buildNextCursor(data, resolvedFilters.limit),
    };
  },

  listUpcoming: async (): Promise<Jam[]> => {
    const { data, error } = await jamRepository.findAll();
    assertNoError(error);

    return Promise.all(data.map((row) => enrichJamRow(row)));
  },

  getById: async (jamId: string, userId: string | null): Promise<JamDetail> => {
    const { data, error } = await jamRepository.findById(jamId);
    assertNoError(error);

    if (data === null) {
      throw new AppError('JAM_NOT_FOUND', 'Jam not found', 404);
    }

    const jam = await enrichJamRow(data);

    if (userId === null) {
      return {
        ...jam,
        isCreator: false,
        isParticipant: false,
      };
    }

    const { data: isParticipant, error: participantError } = await participationRepository.isParticipant(
      jamId,
      userId,
    );
    assertNoError(participantError);

    return {
      ...jam,
      isCreator: jam.creatorId === userId,
      isParticipant,
    };
  },

  create: async (userId: string, input: CreateJamInput): Promise<Jam> => {
    const validated = createJamSchema.parse(input);

    const { data, error } = await jamRepository.create({
      jam: {
        creator_id: userId,
        title: validated.title,
        description: validated.description,
        starts_at: validated.startsAt,
        location_name: validated.locationName,
        latitude: validated.latitude,
        longitude: validated.longitude,
        skill_level: validated.skillLevel,
        max_participants: validated.maxParticipants,
      },
      instrumentIds: validated.instrumentIds,
      styleIds: validated.styleIds,
    });
    assertNoError(error);

    if (data === null) {
      throw new AppError('UNKNOWN', 'Failed to create jam', 500);
    }

    return mapJamRow(data, 0, null, validated.instrumentIds, validated.styleIds);
  },

  update: async (userId: string, jamId: string, input: UpdateJamInput): Promise<Jam> => {
    const validated = updateJamSchema.parse(input);

    const { data: existingJam, error: fetchError } = await jamRepository.findById(jamId);
    assertNoError(fetchError);

    if (existingJam === null) {
      throw new AppError('JAM_NOT_FOUND', 'Jam not found', 404);
    }

    assertCreator(existingJam, userId);

    const { data, error } = await jamRepository.update({
      jamId,
      jam: {
        title: validated.title,
        description: validated.description,
        starts_at: validated.startsAt,
        location_name: validated.locationName,
        latitude: validated.latitude,
        longitude: validated.longitude,
        skill_level: validated.skillLevel,
        max_participants: validated.maxParticipants,
      },
      instrumentIds: validated.instrumentIds,
      styleIds: validated.styleIds,
    });
    assertNoError(error);

    if (data === null) {
      throw new AppError('UNKNOWN', 'Failed to update jam', 500);
    }

    const { data: participantCount, error: countError } = await jamRepository.getParticipantCount(jamId);
    assertNoError(countError);

    return mapJamRow(
      data,
      participantCount,
      null,
      validated.instrumentIds,
      validated.styleIds,
    );
  },

  delete: async (userId: string, jamId: string): Promise<void> => {
    const { data: existingJam, error: fetchError } = await jamRepository.findById(jamId);
    assertNoError(fetchError);

    if (existingJam === null) {
      throw new AppError('JAM_NOT_FOUND', 'Jam not found', 404);
    }

    assertCreator(existingJam, userId);

    const { error } = await jamRepository.delete(jamId);
    assertNoError(error);
  },

  getParticipants: async (jamId: string): Promise<JamParticipant[]> => {
    const { data, error } = await participationRepository.findByJamId(jamId);
    assertNoError(error);

    return data;
  },
};
