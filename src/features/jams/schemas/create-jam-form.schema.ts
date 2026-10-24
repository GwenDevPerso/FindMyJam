import { z } from 'zod';

import { jamRecurrenceOptionSchema } from '@/features/jams/schemas/create-jam.schema';
import type { CreateJamInput, UpdateJamInput, UpdateJamSeriesInput } from '@/features/jams/types';
import {
  geoCoordinatesSchema,
  skillLevelSchema,
  uuidArraySchema,
} from '@/lib/validation/common-schemas';
import type { Jam } from '@/types/domain';
import { toLocalDateParts } from '@/utils/date';

export const createJamFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().trim().max(2000, 'Description must be 2000 characters or less'),
  date: z.string().trim().min(1, 'Date is required'),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM format (e.g. 20:00)'),
  locationName: z.string().trim().min(1, 'Location is required').max(200),
  latitude: geoCoordinatesSchema.shape.latitude,
  longitude: geoCoordinatesSchema.shape.longitude,
  skillLevel: skillLevelSchema,
  maxParticipants: z.number().int().min(2).max(100),
  instrumentIds: uuidArraySchema,
  styleIds: uuidArraySchema,
  /** Only offered on creation; `none` everywhere else. */
  recurrence: jamRecurrenceOptionSchema,
});

export type CreateJamFormValues = z.infer<typeof createJamFormSchema>;

/** Form → input of a single jam update (a one-off jam, or one date of a series). */
export function mapJamFormToUpdateInput(values: CreateJamFormValues): UpdateJamInput {
  const startsAt = new Date(`${values.date}T${values.time}:00`).toISOString();

  return {
    title: values.title,
    description: values.description.length > 0 ? values.description : null,
    startsAt,
    locationName: values.locationName,
    latitude: values.latitude,
    longitude: values.longitude,
    skillLevel: values.skillLevel,
    maxParticipants: values.maxParticipants,
    instrumentIds: values.instrumentIds,
    styleIds: values.styleIds,
  };
}

export function mapCreateJamFormToInput(values: CreateJamFormValues): CreateJamInput {
  return {
    ...mapJamFormToUpdateInput(values),
    recurrence: values.recurrence,
  };
}

/** Form → template of a series: the date is ignored (the day of a series cannot change), the time is kept. */
export function mapJamFormToSeriesInput(values: CreateJamFormValues): UpdateJamSeriesInput {
  return {
    title: values.title,
    description: values.description.length > 0 ? values.description : null,
    localTime: values.time,
    locationName: values.locationName,
    latitude: values.latitude,
    longitude: values.longitude,
    skillLevel: values.skillLevel,
    maxParticipants: values.maxParticipants,
    instrumentIds: values.instrumentIds,
    styleIds: values.styleIds,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Inverse of `mapJamFormToUpdateInput`: the start date is shown in the device's local time. */
export function mapJamToFormValues(jam: Jam): CreateJamFormValues {
  const { date, time } = toLocalDateParts(jam.startsAt);

  return {
    title: jam.title,
    description: jam.description ?? '',
    date,
    time,
    locationName: jam.locationName,
    latitude: jam.latitude,
    longitude: jam.longitude,
    skillLevel: jam.skillLevel,
    maxParticipants: jam.maxParticipants,
    instrumentIds: jam.instrumentIds,
    styleIds: jam.styleIds,
    recurrence: 'none',
  };
}

export function getDefaultJamDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
}

export const DEFAULT_JAM_TIME = '20:00';
