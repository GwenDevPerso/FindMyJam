import type { JamListCursor } from '@/features/jams/types';
import type { SkillLevel } from '@/types/domain';

export type MapJamMarker = {
  id: string;
  title: string;
  locationName: string;
  latitude: number;
  longitude: number;
  skillLevel: SkillLevel;
  startsAt: string;
  distanceMeters: number | null;
  participantCount: number;
  maxParticipants: number;
};

export type MapSearchParams = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  instrumentIds: string[];
  styleIds: string[];
  startsAfter: string;
  startsBefore: string | null;
};

export type MapJamsPage = {
  markers: MapJamMarker[];
  nextCursor: JamListCursor | null;
};

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};
