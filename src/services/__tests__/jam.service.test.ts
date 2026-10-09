import { ZodError } from 'zod';

import type { CreateJamInput } from '@/features/jams/types';
import type { SearchJamRow } from '@/lib/supabase/types';
import { jamRepository } from '@/repositories/jam.repository';
import { participationRepository } from '@/repositories/participation.repository';
import { jamService } from '@/services/jam.service';
import { buildJamRow } from '@/test-utils/jam-rows';
import { buildPostgrestError } from '@/test-utils/supabase-errors';

jest.mock('@/repositories/jam.repository');
jest.mock('@/repositories/participation.repository');

const mockedJamRepository = jest.mocked(jamRepository);
const mockedParticipationRepository = jest.mocked(participationRepository);

const JAM_ID = '11111111-1111-4111-8111-111111111111';
const CREATOR_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333';
const INSTRUMENT_ID = '44444444-4444-4444-8444-444444444444';
const STYLE_ID = '55555555-5555-4555-8555-555555555555';

function buildSearchJamRow(overrides: Partial<SearchJamRow>): SearchJamRow {
  return { ...buildJamRow({}), participant_count: 3, distance_meters: 1200, ...overrides };
}

function buildCreateJamInput(overrides: Partial<CreateJamInput>): CreateJamInput {
  return {
    title: 'Sunday jazz session',
    description: null,
    startsAt: '2026-08-01T18:00:00.000Z',
    locationName: 'Le Caveau',
    latitude: 48.85,
    longitude: 2.35,
    skillLevel: 'intermediate',
    maxParticipants: 6,
    instrumentIds: [INSTRUMENT_ID],
    styleIds: [STYLE_ID],
    ...overrides,
  };
}

function mockEnrichment(participantCount: number): void {
  mockedJamRepository.getParticipantCount.mockResolvedValue({ data: participantCount, error: null });
  mockedJamRepository.getInstrumentIds.mockResolvedValue({ data: [INSTRUMENT_ID], error: null });
  mockedJamRepository.getStyleIds.mockResolvedValue({ data: [STYLE_ID], error: null });
}

describe('jamService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('list', () => {
    it('maps search rows to domain jams with their instruments and styles', async () => {
      mockedJamRepository.search.mockResolvedValue({ data: [buildSearchJamRow({})], error: null });
      mockEnrichment(0);

      const result = await jamService.list({ limit: 20 });

      expect(result.jams).toEqual([
        {
          id: JAM_ID,
          creatorId: CREATOR_ID,
          title: 'Sunday jazz session',
          description: 'Bring your own amp',
          startsAt: '2026-08-01T18:00:00.000Z',
          locationName: 'Le Caveau',
          latitude: 48.85,
          longitude: 2.35,
          skillLevel: 'intermediate',
          maxParticipants: 6,
          participantCount: 3,
          distanceMeters: 1200,
          instrumentIds: [INSTRUMENT_ID],
          styleIds: [STYLE_ID],
          createdAt: '2026-07-01T10:00:00.000Z',
          updatedAt: '2026-07-02T10:00:00.000Z',
        },
      ]);
    });

    it('passes the given filters and cursor through to the repository', async () => {
      mockedJamRepository.search.mockResolvedValue({ data: [], error: null });
      const filters = {
        latitude: 45.76,
        longitude: 4.83,
        radiusMeters: 10_000,
        instrumentIds: [INSTRUMENT_ID],
        styleIds: [STYLE_ID],
        startsAfter: '2026-07-21T00:00:00.000Z',
        startsBefore: '2026-07-28T00:00:00.000Z',
        limit: 5,
        cursor: { distanceMeters: 900, startsAt: '2026-07-22T18:00:00.000Z', id: JAM_ID },
      };

      await jamService.list(filters);

      expect(mockedJamRepository.search).toHaveBeenCalledWith(filters);
    });

    it('falls back to default filters starting from the current time', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-21T12:00:00.000Z'));
      mockedJamRepository.search.mockResolvedValue({ data: [], error: null });

      try {
        await jamService.list(undefined);
      } finally {
        jest.useRealTimers();
      }

      expect(mockedJamRepository.search).toHaveBeenCalledWith({
        latitude: 48.8566,
        longitude: 2.3522,
        radiusMeters: 50_000,
        instrumentIds: [],
        styleIds: [],
        startsAfter: '2026-07-21T12:00:00.000Z',
        startsBefore: null,
        limit: 20,
        cursor: null,
      });
    });

    it('returns a cursor built from the last row when the page is full', async () => {
      mockedJamRepository.search.mockResolvedValue({
        data: [
          buildSearchJamRow({ id: JAM_ID }),
          buildSearchJamRow({
            id: '66666666-6666-4666-8666-666666666666',
            distance_meters: 2500,
            starts_at: '2026-08-02T18:00:00.000Z',
          }),
        ],
        error: null,
      });
      mockEnrichment(0);

      const result = await jamService.list({ limit: 2 });

      expect(result.nextCursor).toEqual({
        distanceMeters: 2500,
        startsAt: '2026-08-02T18:00:00.000Z',
        id: '66666666-6666-4666-8666-666666666666',
      });
    });

    it('returns no cursor when the page is not full', async () => {
      mockedJamRepository.search.mockResolvedValue({ data: [buildSearchJamRow({})], error: null });
      mockEnrichment(0);

      const result = await jamService.list({ limit: 2 });

      expect(result.nextCursor).toBeNull();
    });

    it('throws the mapped AppError when the search fails', async () => {
      mockedJamRepository.search.mockResolvedValue({
        data: [],
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(jamService.list({})).rejects.toMatchObject({
        name: 'AppError',
        code: 'UNAUTHORIZED',
        message: 'permission denied',
      });
    });
  });

  describe('getById', () => {
    it('throws JAM_NOT_FOUND when the jam does not exist', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: null, error: null });

      await expect(jamService.getById(JAM_ID, CREATOR_ID)).rejects.toMatchObject({
        code: 'JAM_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('returns the jam with its participant count and no distance', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: buildJamRow({}), error: null });
      mockEnrichment(4);
      mockedParticipationRepository.isParticipant.mockResolvedValue({ data: false, error: null });

      const jam = await jamService.getById(JAM_ID, OTHER_USER_ID);

      expect(jam).toMatchObject({
        id: JAM_ID,
        participantCount: 4,
        distanceMeters: null,
        instrumentIds: [INSTRUMENT_ID],
        styleIds: [STYLE_ID],
      });
    });

    it('flags the creator', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: buildJamRow({}), error: null });
      mockEnrichment(0);
      mockedParticipationRepository.isParticipant.mockResolvedValue({ data: false, error: null });

      const jam = await jamService.getById(JAM_ID, CREATOR_ID);

      expect(jam.isCreator).toBe(true);
      expect(jam.isParticipant).toBe(false);
    });

    it('flags a participant who is not the creator', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: buildJamRow({}), error: null });
      mockEnrichment(1);
      mockedParticipationRepository.isParticipant.mockResolvedValue({ data: true, error: null });

      const jam = await jamService.getById(JAM_ID, OTHER_USER_ID);

      expect(jam.isCreator).toBe(false);
      expect(jam.isParticipant).toBe(true);
    });

    it('does not look up participation for an anonymous user', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: buildJamRow({}), error: null });
      mockEnrichment(1);

      const jam = await jamService.getById(JAM_ID, null);

      expect(jam.isCreator).toBe(false);
      expect(jam.isParticipant).toBe(false);
      expect(mockedParticipationRepository.isParticipant).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('sends the validated jam as a snake_case row owned by the user', async () => {
      mockedJamRepository.create.mockResolvedValue({ data: buildJamRow({}), error: null });

      await jamService.create(CREATOR_ID, buildCreateJamInput({ title: '  Sunday jazz session  ' }));

      expect(mockedJamRepository.create).toHaveBeenCalledWith({
        jam: {
          creator_id: CREATOR_ID,
          title: 'Sunday jazz session',
          description: null,
          starts_at: '2026-08-01T18:00:00.000Z',
          location_name: 'Le Caveau',
          latitude: 48.85,
          longitude: 2.35,
          skill_level: 'intermediate',
          max_participants: 6,
        },
        instrumentIds: [INSTRUMENT_ID],
        styleIds: [STYLE_ID],
      });
    });

    it('returns the created jam with no participants yet', async () => {
      mockedJamRepository.create.mockResolvedValue({ data: buildJamRow({}), error: null });

      const jam = await jamService.create(CREATOR_ID, buildCreateJamInput({}));

      expect(jam).toMatchObject({
        id: JAM_ID,
        creatorId: CREATOR_ID,
        participantCount: 0,
        distanceMeters: null,
        instrumentIds: [INSTRUMENT_ID],
        styleIds: [STYLE_ID],
      });
    });

    it('rejects an invalid input without calling the repository', async () => {
      await expect(
        jamService.create(CREATOR_ID, buildCreateJamInput({ maxParticipants: 1 })),
      ).rejects.toBeInstanceOf(ZodError);

      expect(mockedJamRepository.create).not.toHaveBeenCalled();
    });

    it('throws the mapped AppError when the insert fails', async () => {
      mockedJamRepository.create.mockResolvedValue({
        data: null,
        error: buildPostgrestError({ code: '42501', message: 'permission denied' }),
      });

      await expect(jamService.create(CREATOR_ID, buildCreateJamInput({}))).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('throws UNKNOWN when the insert returns no row', async () => {
      mockedJamRepository.create.mockResolvedValue({ data: null, error: null });

      await expect(jamService.create(CREATOR_ID, buildCreateJamInput({}))).rejects.toMatchObject({
        code: 'UNKNOWN',
        statusCode: 500,
      });
    });
  });

  describe('update', () => {
    it('refuses an update from someone who is not the creator', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: buildJamRow({}), error: null });

      await expect(
        jamService.update(OTHER_USER_ID, JAM_ID, buildCreateJamInput({})),
      ).rejects.toMatchObject({ code: 'NOT_CREATOR', statusCode: 403 });

      expect(mockedJamRepository.update).not.toHaveBeenCalled();
    });

    it('throws JAM_NOT_FOUND when the jam does not exist', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: null, error: null });

      await expect(
        jamService.update(CREATOR_ID, JAM_ID, buildCreateJamInput({})),
      ).rejects.toMatchObject({ code: 'JAM_NOT_FOUND' });
    });

    it('updates the jam and returns it with its current participant count', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: buildJamRow({}), error: null });
      mockedJamRepository.update.mockResolvedValue({
        data: buildJamRow({ title: 'Monday blues' }),
        error: null,
      });
      mockedJamRepository.getParticipantCount.mockResolvedValue({ data: 2, error: null });

      const jam = await jamService.update(CREATOR_ID, JAM_ID, buildCreateJamInput({ title: 'Monday blues' }));

      expect(mockedJamRepository.update).toHaveBeenCalledWith({
        jamId: JAM_ID,
        jam: {
          title: 'Monday blues',
          description: null,
          starts_at: '2026-08-01T18:00:00.000Z',
          location_name: 'Le Caveau',
          latitude: 48.85,
          longitude: 2.35,
          skill_level: 'intermediate',
          max_participants: 6,
        },
        instrumentIds: [INSTRUMENT_ID],
        styleIds: [STYLE_ID],
      });
      expect(jam).toMatchObject({ title: 'Monday blues', participantCount: 2 });
    });
  });

  describe('delete', () => {
    it('refuses a deletion from someone who is not the creator', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: buildJamRow({}), error: null });

      await expect(jamService.delete(OTHER_USER_ID, JAM_ID)).rejects.toMatchObject({ code: 'NOT_CREATOR' });

      expect(mockedJamRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes the jam for its creator', async () => {
      mockedJamRepository.findById.mockResolvedValue({ data: buildJamRow({}), error: null });
      mockedJamRepository.delete.mockResolvedValue({ error: null });

      await jamService.delete(CREATOR_ID, JAM_ID);

      expect(mockedJamRepository.delete).toHaveBeenCalledWith(JAM_ID);
    });
  });

  describe('getParticipants', () => {
    it('returns the participants of the jam', async () => {
      const participants = [
        { jamId: JAM_ID, userId: OTHER_USER_ID, username: 'miles', avatarUrl: null, joinedAt: '2026-07-10T10:00:00.000Z' },
      ];
      mockedParticipationRepository.findByJamId.mockResolvedValue({ data: participants, error: null });

      await expect(jamService.getParticipants(JAM_ID)).resolves.toEqual(participants);
      expect(mockedParticipationRepository.findByJamId).toHaveBeenCalledWith(JAM_ID);
    });
  });
});
