import type { JamListCursor } from '@/features/jams/types';
import { MAP_JAM_PAGE_SIZE } from '@/features/map/constants';
import type { MapJamMarker, MapJamsPage, MapSearchParams } from '@/features/map/types';
import { jamService } from '@/services/jam.service';
import type { Jam } from '@/types/domain';

function mapJamToMarker(jam: Jam): MapJamMarker {
  return {
    id: jam.id,
    title: jam.title,
    locationName: jam.locationName,
    latitude: jam.latitude,
    longitude: jam.longitude,
    skillLevel: jam.skillLevel,
    startsAt: jam.startsAt,
    distanceMeters: jam.distanceMeters,
    participantCount: jam.participantCount,
    maxParticipants: jam.maxParticipants,
  };
}

export const mapService = {
  searchJams: async (params: MapSearchParams, cursor: JamListCursor | null): Promise<MapJamsPage> => {
    const result = await jamService.list({
      latitude: params.latitude,
      longitude: params.longitude,
      radiusMeters: params.radiusMeters,
      instrumentIds: params.instrumentIds,
      styleIds: params.styleIds,
      startsAfter: params.startsAfter,
      startsBefore: params.startsBefore,
      limit: MAP_JAM_PAGE_SIZE,
      cursor,
    });

    return {
      markers: result.jams.map(mapJamToMarker),
      nextCursor: result.nextCursor,
    };
  },
};
