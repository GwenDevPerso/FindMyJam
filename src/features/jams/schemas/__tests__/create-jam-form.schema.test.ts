import {
  createJamFormSchema,
  getDefaultJamDate,
  mapCreateJamFormToInput,
  type CreateJamFormValues,
} from '@/features/jams/schemas/create-jam-form.schema';

const INSTRUMENT_ID = '11111111-1111-4111-8111-111111111111';
const STYLE_ID = '22222222-2222-4222-8222-222222222222';

function buildFormValues(overrides: Partial<CreateJamFormValues>): CreateJamFormValues {
  return {
    title: 'Sunday jazz session',
    description: 'Bring your own amp',
    date: '2026-08-01',
    time: '20:00',
    locationName: 'Le Caveau',
    latitude: 48.85,
    longitude: 2.35,
    skillLevel: 'all_levels',
    maxParticipants: 10,
    instrumentIds: [INSTRUMENT_ID],
    styleIds: [STYLE_ID],
    ...overrides,
  };
}

function firstIssueFor(overrides: Partial<CreateJamFormValues>): { path: PropertyKey[]; message: string } | undefined {
  const result = createJamFormSchema.safeParse(buildFormValues(overrides));

  return result.success ? undefined : result.error.issues[0];
}

describe('createJamFormSchema', () => {
  it('accepts a complete form and trims text fields', () => {
    const result = createJamFormSchema.safeParse(
      buildFormValues({ title: '  Sunday jazz session ', locationName: ' Le Caveau ' }),
    );

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ title: 'Sunday jazz session', locationName: 'Le Caveau' });
  });

  it('accepts an empty description', () => {
    expect(createJamFormSchema.safeParse(buildFormValues({ description: '' })).success).toBe(true);
  });

  it.each([
    [{ title: '   ' }, 'title', 'Title is required'],
    [{ description: 'a'.repeat(2001) }, 'description', 'Description must be 2000 characters or less'],
    [{ date: '' }, 'date', 'Date is required'],
    [{ time: '8pm' }, 'time', 'Use HH:MM format (e.g. 20:00)'],
    [{ time: '24:00' }, 'time', 'Use HH:MM format (e.g. 20:00)'],
    [{ time: '9:30' }, 'time', 'Use HH:MM format (e.g. 20:00)'],
    [{ locationName: '' }, 'locationName', 'Location is required'],
  ] as const)('rejects %j on %s with "%s"', (overrides, field, message) => {
    expect(firstIssueFor(overrides)).toMatchObject({ path: [field], message });
  });

  it.each<[Partial<CreateJamFormValues>, string]>([
    [{ title: 'a'.repeat(121) }, 'title'],
    [{ maxParticipants: 1 }, 'maxParticipants'],
    [{ maxParticipants: 101 }, 'maxParticipants'],
    [{ maxParticipants: 2.5 }, 'maxParticipants'],
    [{ latitude: 91 }, 'latitude'],
    [{ longitude: -181 }, 'longitude'],
    [{ skillLevel: 'virtuoso' as CreateJamFormValues['skillLevel'] }, 'skillLevel'],
    [{ instrumentIds: ['guitar'] }, 'instrumentIds'],
    [{ styleIds: ['jazz'] }, 'styleIds'],
  ])('rejects %j on %s', (overrides, field) => {
    expect(firstIssueFor(overrides)?.path[0]).toBe(field);
  });

  it.each([2, 100])('accepts %d participants', (maxParticipants) => {
    expect(createJamFormSchema.safeParse(buildFormValues({ maxParticipants })).success).toBe(true);
  });

  // Suspected bug: `date` only has to be non-empty, so "tomorrow" passes validation and
  // mapCreateJamFormToInput then throws RangeError (Invalid time value) at create-jam-form.schema.ts:40.
  it.skip('rejects a date that is not a real YYYY-MM-DD date', () => {
    expect(firstIssueFor({ date: 'tomorrow' })?.path[0]).toBe('date');
  });
});

describe('mapCreateJamFormToInput', () => {
  it('combines the local date and time into an ISO start date', () => {
    const input = mapCreateJamFormToInput(buildFormValues({ date: '2026-08-01', time: '20:30' }));

    expect(input.startsAt).toBe(new Date(2026, 7, 1, 20, 30, 0).toISOString());
  });

  it('turns an empty description into null', () => {
    expect(mapCreateJamFormToInput(buildFormValues({ description: '' })).description).toBeNull();
  });

  it('carries every other field over unchanged', () => {
    const input = mapCreateJamFormToInput(buildFormValues({}));

    expect(input).toMatchObject({
      title: 'Sunday jazz session',
      description: 'Bring your own amp',
      locationName: 'Le Caveau',
      latitude: 48.85,
      longitude: 2.35,
      skillLevel: 'all_levels',
      maxParticipants: 10,
      instrumentIds: [INSTRUMENT_ID],
      styleIds: [STYLE_ID],
    });
  });

  it('throws on a date that passed validation but is not a date (current behaviour)', () => {
    const values = createJamFormSchema.parse(buildFormValues({ date: 'tomorrow' }));

    expect(() => mapCreateJamFormToInput(values)).toThrow(RangeError);
  });
});

describe('getDefaultJamDate', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns tomorrow as a zero-padded local YYYY-MM-DD', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 2, 4, 12, 0, 0));

    expect(getDefaultJamDate()).toBe('2026-03-05');
  });

  it('rolls over to the next year on December 31st', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 11, 31, 23, 30, 0));

    expect(getDefaultJamDate()).toBe('2027-01-01');
  });
});
