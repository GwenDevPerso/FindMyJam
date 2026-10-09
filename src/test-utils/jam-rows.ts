import type { JamRow } from '@/lib/supabase/types';

export function buildJamRow(overrides: Partial<JamRow>): JamRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    creator_id: '22222222-2222-4222-8222-222222222222',
    title: 'Sunday jazz session',
    description: 'Bring your own amp',
    starts_at: '2026-08-01T18:00:00.000Z',
    location_name: 'Le Caveau',
    latitude: 48.85,
    longitude: 2.35,
    skill_level: 'intermediate',
    max_participants: 6,
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-02T10:00:00.000Z',
    ...overrides,
  };
}
