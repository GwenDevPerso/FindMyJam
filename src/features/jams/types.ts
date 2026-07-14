import type { Jam, JamParticipant, SkillLevel } from '@/types/domain';

export type { Jam, JamParticipant, SkillLevel };

export type JamListCursor = {
  distanceMeters: number;
  startsAt: string;
  id: string;
};

export type JamListFilters = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  instrumentIds: string[];
  styleIds: string[];
  startsAfter: string;
  startsBefore: string | null;
  limit: number;
  cursor: JamListCursor | null;
};

export type JamListResult = {
  jams: Jam[];
  nextCursor: JamListCursor | null;
};

export type CreateJamInput = {
  title: string;
  description: string | null;
  startsAt: string;
  locationName: string;
  latitude: number;
  longitude: number;
  skillLevel: SkillLevel;
  maxParticipants: number;
  instrumentIds: string[];
  styleIds: string[];
};

export type UpdateJamInput = {
  title: string;
  description: string | null;
  startsAt: string;
  locationName: string;
  latitude: number;
  longitude: number;
  skillLevel: SkillLevel;
  maxParticipants: number;
  instrumentIds: string[];
  styleIds: string[];
};

export type JamDetail = Jam & {
  isCreator: boolean;
  isParticipant: boolean;
};
