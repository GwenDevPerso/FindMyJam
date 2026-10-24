import type { PostgrestError } from '@supabase/supabase-js';

import type {
  CreateJamInput,
  JamDetail,
  JamListCursor,
  JamListFilters,
  JamListResult,
  UpdateJamInput,
  UpdateJamSeriesInput,
} from '@/features/jams/types';
import { createJamSchema } from '@/features/jams/schemas/create-jam.schema';
import { updateJamSchema } from '@/features/jams/schemas/update-jam.schema';
import { updateJamSeriesSchema } from '@/features/jams/schemas/update-jam-series.schema';
import { AppError } from '@/lib/errors/app-error';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import type { JamRow, JamSeriesRow, SearchJamRow } from '@/lib/supabase/types';
import type { Jam, JamParticipant, JamRecurrence } from '@/types/domain';
import { jamRepository } from '@/repositories/jam.repository';
import { jamSeriesRepository } from '@/repositories/jam-series.repository';
import { participationRepository } from '@/repositories/participation.repository';
import { toLocalDateParts } from '@/utils/date';

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
    seriesId: row.series_id,
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

function assertCreator(owned: { creator_id: string }, userId: string): void {
  if (owned.creator_id !== userId) {
    throw new AppError('NOT_CREATOR', 'Only the jam creator can perform this action', 403);
  }
}

async function getRecurrence(seriesId: string | null): Promise<JamRecurrence | null> {
  if (seriesId === null) {
    return null;
  }

  const { data, error } = await jamSeriesRepository.findById(seriesId);
  assertNoError(error);

  return data?.frequency ?? null;
}

async function getOwnedSeries(userId: string, seriesId: string): Promise<JamSeriesRow> {
  const { data, error } = await jamSeriesRepository.findById(seriesId);
  assertNoError(error);

  if (data === null) {
    throw new AppError('JAM_NOT_FOUND', 'Jam series not found', 404);
  }

  assertCreator(data, userId);

  return data;
}

/**
 * Creates a series and its first dates (the database keeps a rolling window of them topped up). The local day
 * and time of the first date, read in the device's time zone, become the series' schedule. The RPC makes the
 * signed-in user (`auth.uid()`) the creator.
 */
async function createSeries(
  recurrence: JamRecurrence,
  validated: Omit<CreateJamInput, 'recurrence'>,
): Promise<Jam> {
  const { date, time } = toLocalDateParts(validated.startsAt);

  const { data, error } = await jamSeriesRepository.create({
    p_frequency: recurrence,
    p_anchor_date: date,
    p_local_time: time,
    p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    p_title: validated.title,
    p_description: validated.description,
    p_location_name: validated.locationName,
    p_latitude: validated.latitude,
    p_longitude: validated.longitude,
    p_skill_level: validated.skillLevel,
    p_max_participants: validated.maxParticipants,
    p_instrument_ids: validated.instrumentIds,
    p_style_ids: validated.styleIds,
  });
  assertNoError(error);

  if (data === null || data.first_jam_id === null) {
    throw new AppError('UNKNOWN', 'Failed to create jam', 500);
  }

  const { data: firstJam, error: firstJamError } = await jamRepository.findById(data.first_jam_id);
  assertNoError(firstJamError);

  if (firstJam === null) {
    throw new AppError('UNKNOWN', 'Failed to create jam', 500);
  }

  return mapJamRow(firstJam, 0, null, validated.instrumentIds, validated.styleIds);
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

    const [jam, recurrence] = await Promise.all([enrichJamRow(data), getRecurrence(data.series_id)]);

    if (userId === null) {
      return {
        ...jam,
        isCreator: false,
        isParticipant: false,
        recurrence,
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
      recurrence,
    };
  },

  create: async (userId: string, input: CreateJamInput): Promise<Jam> => {
    const { recurrence, ...validated } = createJamSchema.parse(input);

    if (recurrence !== 'none') {
      return createSeries(recurrence, validated);
    }

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

  /** Applies the template to the series and to all its upcoming dates; past dates keep their values. */
  updateSeries: async (userId: string, seriesId: string, input: UpdateJamSeriesInput): Promise<void> => {
    const validated = updateJamSeriesSchema.parse(input);

    await getOwnedSeries(userId, seriesId);

    const { error } = await jamSeriesRepository.update({
      p_series_id: seriesId,
      p_local_time: validated.localTime,
      p_title: validated.title,
      p_description: validated.description,
      p_location_name: validated.locationName,
      p_latitude: validated.latitude,
      p_longitude: validated.longitude,
      p_skill_level: validated.skillLevel,
      p_max_participants: validated.maxParticipants,
      p_instrument_ids: validated.instrumentIds,
      p_style_ids: validated.styleIds,
    });
    assertNoError(error);
  },

  /** Deletes the upcoming dates and the series; past dates stay as one-off jams. */
  deleteSeries: async (userId: string, seriesId: string): Promise<void> => {
    await getOwnedSeries(userId, seriesId);

    const { error } = await jamSeriesRepository.delete(seriesId);
    assertNoError(error);
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
