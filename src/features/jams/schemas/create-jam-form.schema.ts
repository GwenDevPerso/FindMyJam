import { z } from 'zod';

import {
  geoCoordinatesSchema,
  skillLevelSchema,
  uuidArraySchema,
} from '@/lib/validation/common-schemas';
import type { Jam } from '@/types/domain';

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
});

export type CreateJamFormValues = z.infer<typeof createJamFormSchema>;

export function mapCreateJamFormToInput(values: CreateJamFormValues): {
  title: string;
  description: string | null;
  startsAt: string;
  locationName: string;
  latitude: number;
  longitude: number;
  skillLevel: CreateJamFormValues['skillLevel'];
  maxParticipants: number;
  instrumentIds: string[];
  styleIds: string[];
} {
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

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Inverse of `mapCreateJamFormToInput`: the start date is shown in the device's local time. */
export function mapJamToFormValues(jam: Jam): CreateJamFormValues {
  const startsAt = new Date(jam.startsAt);

  return {
    title: jam.title,
    description: jam.description ?? '',
    date: `${startsAt.getFullYear()}-${pad(startsAt.getMonth() + 1)}-${pad(startsAt.getDate())}`,
    time: `${pad(startsAt.getHours())}:${pad(startsAt.getMinutes())}`,
    locationName: jam.locationName,
    latitude: jam.latitude,
    longitude: jam.longitude,
    skillLevel: jam.skillLevel,
    maxParticipants: jam.maxParticipants,
    instrumentIds: jam.instrumentIds,
    styleIds: jam.styleIds,
  };
}

export function getDefaultJamDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
}

export const DEFAULT_JAM_TIME = '20:00';
