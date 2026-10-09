import type { Jam } from '@/types/domain';

export function buildJam(overrides: Partial<Jam>): Jam {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    creatorId: '22222222-2222-4222-8222-222222222222',
    title: 'Sunday jazz session',
    description: 'Bring your own amp',
    startsAt: '2026-08-01T18:00:00.000Z',
    locationName: 'Le Caveau',
    latitude: 48.85,
    longitude: 2.35,
    skillLevel: 'all_levels',
    maxParticipants: 6,
    participantCount: 3,
    distanceMeters: 1200,
    instrumentIds: [],
    styleIds: [],
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-02T10:00:00.000Z',
    ...overrides,
  };
}
