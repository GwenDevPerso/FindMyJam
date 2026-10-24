import type { MapSearchParams } from '@/features/map/types';
import { jamService } from '@/services/jam.service';
import { mapService } from '@/services/map.service';
import { buildJam } from '@/test-utils/jams';

jest.mock('@/services/jam.service');

const mockedJamService = jest.mocked(jamService);

const JAM_ID = '11111111-1111-4111-8111-111111111111';

const SEARCH_PARAMS: MapSearchParams = {
  latitude: 45.76,
  longitude: 4.83,
  radiusMeters: 10_000,
  instrumentIds: [],
  styleIds: [],
  startsAfter: '2026-07-21T00:00:00.000Z',
  startsBefore: null,
};

describe('mapService', () => {
  describe('searchJams', () => {
    it('asks for the next date of each recurring jam only', async () => {
      mockedJamService.list.mockResolvedValue({ jams: [], nextCursor: null });

      await mapService.searchJams(SEARCH_PARAMS, null);

      expect(mockedJamService.list).toHaveBeenCalledWith({
        ...SEARCH_PARAMS,
        limit: 50,
        cursor: null,
        nextOccurrenceOnly: true,
      });
    });

    it('maps jams to markers and returns the next cursor', async () => {
      const nextCursor = { distanceMeters: 1200, startsAt: '2026-08-01T18:00:00.000Z', id: JAM_ID };
      mockedJamService.list.mockResolvedValue({ jams: [buildJam({ id: JAM_ID })], nextCursor });

      const result = await mapService.searchJams(SEARCH_PARAMS, null);

      expect(result).toEqual({
        markers: [
          {
            id: JAM_ID,
            title: 'Sunday jazz session',
            locationName: 'Le Caveau',
            latitude: 48.85,
            longitude: 2.35,
            skillLevel: 'all_levels',
            startsAt: '2026-08-01T18:00:00.000Z',
            distanceMeters: 1200,
            participantCount: 3,
            maxParticipants: 6,
          },
        ],
        nextCursor,
      });
    });
  });
});
