import { formatDistance, formatParticipantCount, formatSkillLevel } from '@/utils/format';

describe('formatDistance', () => {
  it('returns null when the distance is unknown', () => {
    expect(formatDistance(null)).toBeNull();
  });

  it.each([
    [0, '0 m'],
    [12.4, '12 m'],
    [999, '999 m'],
    [1000, '1.0 km'],
    [1549, '1.5 km'],
    [1550, '1.6 km'],
    [25_000, '25.0 km'],
  ])('formats %d meters as "%s"', (meters, expected) => {
    expect(formatDistance(meters)).toBe(expected);
  });
});

describe('formatParticipantCount', () => {
  it('shows current over maximum', () => {
    expect(formatParticipantCount(3, 10)).toBe('3 / 10');
  });
});

describe('formatSkillLevel', () => {
  it.each([
    ['beginner', 'Beginner'],
    ['all_levels', 'All Levels'],
    ['', ''],
  ])('formats "%s" as "%s"', (level, expected) => {
    expect(formatSkillLevel(level)).toBe(expected);
  });
});
