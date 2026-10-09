import type { z } from 'zod';

import { createJamSchema } from '@/features/jams/schemas/create-jam.schema';

type CreateJamValues = z.infer<typeof createJamSchema>;

function buildInput(overrides: Partial<CreateJamValues>): CreateJamValues {
  return {
    title: 'Sunday jazz session',
    description: null,
    startsAt: '2026-08-01T18:00:00.000Z',
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

function firstIssueFor(overrides: Partial<CreateJamValues>): { path: PropertyKey[]; message: string } | undefined {
  const result = createJamSchema.safeParse(buildInput(overrides));

  return result.success ? undefined : result.error.issues[0];
}

describe('createJamSchema', () => {
  it('accepts a valid jam with a null description and trims the title', () => {
    const result = createJamSchema.safeParse(buildInput({ title: ' Sunday jazz session ' }));

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Sunday jazz session');
    expect(result.data?.description).toBeNull();
  });

  it.each([
    [{ title: '' }, 'title', 'Title is required'],
    [{ startsAt: '2026-08-01 20:00' }, 'startsAt', 'Invalid date'],
    [{ startsAt: '2026-08-01' }, 'startsAt', 'Invalid date'],
    [{ locationName: '  ' }, 'locationName', 'Location is required'],
    [{ description: 'a'.repeat(2001) }, 'description', 'Description must be 2000 characters or less'],
  ] as const)('rejects %j on %s with "%s"', (overrides, field, message) => {
    expect(firstIssueFor(overrides)).toMatchObject({ path: [field], message });
  });

  it.each<[Partial<CreateJamValues>, string]>([
    [{ maxParticipants: 1 }, 'maxParticipants'],
    [{ maxParticipants: 101 }, 'maxParticipants'],
    [{ latitude: -90.1 }, 'latitude'],
    [{ longitude: 180.1 }, 'longitude'],
    [{ skillLevel: 'pro' as CreateJamValues['skillLevel'] }, 'skillLevel'],
    [{ instrumentIds: ['not-a-uuid'] }, 'instrumentIds'],
  ])('rejects %j on %s', (overrides, field) => {
    expect(firstIssueFor(overrides)?.path[0]).toBe(field);
  });
});
