import type { z } from 'zod';

import { updateJamSeriesSchema } from '@/features/jams/schemas/update-jam-series.schema';

type UpdateJamSeriesValues = z.infer<typeof updateJamSeriesSchema>;

function buildInput(overrides: Partial<UpdateJamSeriesValues>): UpdateJamSeriesValues {
  return {
    title: 'Tuesday jazz night',
    description: null,
    localTime: '20:30',
    locationName: 'Le Caveau',
    latitude: 48.85,
    longitude: 2.35,
    skillLevel: 'intermediate',
    maxParticipants: 6,
    instrumentIds: ['11111111-1111-4111-8111-111111111111'],
    styleIds: [],
    ...overrides,
  };
}

function firstIssueFor(overrides: Partial<UpdateJamSeriesValues>): { path: PropertyKey[]; message: string } | undefined {
  const result = updateJamSeriesSchema.safeParse(buildInput(overrides));

  return result.success ? undefined : result.error.issues[0];
}

describe('updateJamSeriesSchema', () => {
  it('accepts a valid template and trims the title', () => {
    const result = updateJamSeriesSchema.safeParse(buildInput({ title: ' Tuesday jazz night ' }));

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Tuesday jazz night');
  });

  it('carries no start date nor recurrence: the day of a series cannot change', () => {
    const result = updateJamSeriesSchema.safeParse({
      ...buildInput({}),
      startsAt: '2026-08-01T18:00:00.000Z',
      recurrence: 'weekly',
    });

    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('startsAt');
    expect(result.data).not.toHaveProperty('recurrence');
  });

  it.each(['8pm', '24:00', '9:30', ''])('rejects the time "%s"', (localTime) => {
    expect(firstIssueFor({ localTime })).toMatchObject({
      path: ['localTime'],
      message: 'Use HH:MM format (e.g. 20:00)',
    });
  });

  it.each<[Partial<UpdateJamSeriesValues>, string]>([
    [{ title: '' }, 'title'],
    [{ maxParticipants: 1 }, 'maxParticipants'],
    [{ latitude: 91 }, 'latitude'],
    [{ styleIds: ['jazz'] }, 'styleIds'],
  ])('rejects %j on %s', (overrides, field) => {
    expect(firstIssueFor(overrides)?.path[0]).toBe(field);
  });
});
