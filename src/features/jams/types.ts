import type { Jam, JamParticipant, JamRecurrence, SkillLevel } from '@/types/domain';

export type { Jam, JamParticipant, JamRecurrence, SkillLevel };

/** Recurrence chosen when creating a jam; `none` is a one-off jam. */
export type JamRecurrenceOption = 'none' | JamRecurrence;

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
  /** Keeps one jam per series, its earliest date matching the filters; one-off jams are unaffected. */
  nextOccurrenceOnly: boolean;
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
  recurrence: JamRecurrenceOption;
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

/** Template applied to every upcoming date of a series. `localTime` is `HH:MM` in the series' time zone. */
export type UpdateJamSeriesInput = {
  title: string;
  description: string | null;
  localTime: string;
  locationName: string;
  latitude: number;
  longitude: number;
  skillLevel: SkillLevel;
  maxParticipants: number;
  instrumentIds: string[];
  styleIds: string[];
};

/** Where the current user stands on a jam's waitlist. */
export type JamWaitlistStatus = {
  /** 1-based rank among the people waiting; null when the user is not on the list. */
  position: number | null;
  size: number;
};

export type JamDetail = Jam & {
  isCreator: boolean;
  isParticipant: boolean;
  /** Recurrence of the jam's series; null for a one-off jam. */
  recurrence: JamRecurrence | null;
};
