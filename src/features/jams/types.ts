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
  /** Last date of a series (`YYYY-MM-DD`, inclusive); null when it never ends. Ignored for a one-off jam. */
  endsOn: string | null;
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
  /** Last date of the series (`YYYY-MM-DD`, inclusive); null when it never ends. */
  endsOn: string | null;
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
  /** Last date of the jam's series (`YYYY-MM-DD`); null when it never ends or for a one-off jam. */
  recurrenceEndsOn: string | null;
};

/** A jam of the user's calendar: one they created, or one they joined. */
export type CalendarJam = {
  id: string;
  title: string;
  startsAt: string;
  role: 'created' | 'participant';
};
