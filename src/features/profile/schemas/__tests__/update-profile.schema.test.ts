import {
  updateProfileFormSchema,
  updateProfileSchema,
  type UpdateProfileFormValues,
} from '@/features/profile/schemas/update-profile.schema';

function buildValues(overrides: Partial<UpdateProfileFormValues>): UpdateProfileFormValues {
  return {
    username: 'miles_davis',
    bio: 'Trumpet',
    skillLevel: 'expert',
    locationName: 'Paris',
    latitude: 48.85,
    longitude: 2.35,
    instrumentIds: ['11111111-1111-4111-8111-111111111111'],
    styleIds: [],
    ...overrides,
  };
}

function firstIssueFor(overrides: Partial<UpdateProfileFormValues>): { path: PropertyKey[]; message: string } | undefined {
  const result = updateProfileFormSchema.safeParse(buildValues(overrides));

  return result.success ? undefined : result.error.issues[0];
}

describe('updateProfileFormSchema', () => {
  it('accepts a complete profile', () => {
    expect(updateProfileFormSchema.safeParse(buildValues({})).success).toBe(true);
  });

  it('accepts a profile with no skill level and no coordinates', () => {
    const result = updateProfileFormSchema.safeParse(
      buildValues({ skillLevel: null, latitude: null, longitude: null }),
    );

    expect(result.success).toBe(true);
  });

  it.each([
    [{ username: 'ab' }, 'username', 'Username must be at least 3 characters'],
    [{ username: 'a'.repeat(31) }, 'username', 'Username must be 30 characters or less'],
    [{ username: 'miles davis' }, 'username', 'Username can only contain letters, numbers and underscores'],
    [{ username: 'miles-davis' }, 'username', 'Username can only contain letters, numbers and underscores'],
    [{ bio: 'a'.repeat(501) }, 'bio', 'Bio must be 500 characters or less'],
    [{ locationName: 'a'.repeat(201) }, 'locationName', 'Location must be 200 characters or less'],
    [{ longitude: null }, 'latitude', 'Latitude and longitude must both be set or both be empty'],
    [{ latitude: null }, 'latitude', 'Latitude and longitude must both be set or both be empty'],
  ] as const)('rejects %j on %s with "%s"', (overrides, field, message) => {
    expect(firstIssueFor(overrides)).toMatchObject({ path: [field], message });
  });

  it.each<[Partial<UpdateProfileFormValues>, string]>([
    [{ latitude: 90.5 }, 'latitude'],
    [{ skillLevel: 'pro' as UpdateProfileFormValues['skillLevel'] }, 'skillLevel'],
    [{ styleIds: ['jazz'] }, 'styleIds'],
  ])('rejects %j on %s', (overrides, field) => {
    expect(firstIssueFor(overrides)?.path[0]).toBe(field);
  });
});

describe('updateProfileSchema', () => {
  it('trims the username and keeps filled-in fields', () => {
    const result = updateProfileSchema.safeParse(buildValues({ username: '  miles_davis ' }));

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      username: 'miles_davis',
      bio: 'Trumpet',
      skillLevel: 'expert',
      locationName: 'Paris',
      latitude: 48.85,
      longitude: 2.35,
      instrumentIds: ['11111111-1111-4111-8111-111111111111'],
      styleIds: [],
    });
  });

  it('turns a blank bio and location into null', () => {
    const result = updateProfileSchema.safeParse(buildValues({ bio: '   ', locationName: '' }));

    expect(result.data?.bio).toBeNull();
    expect(result.data?.locationName).toBeNull();
  });

  it('still applies the form validation', () => {
    expect(updateProfileSchema.safeParse(buildValues({ username: 'ab' })).success).toBe(false);
  });
});
