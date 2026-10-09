import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas/register.schema';

function buildValues(overrides: Partial<RegisterFormValues>): RegisterFormValues {
  return { username: 'miles_davis', email: 'miles@example.com', password: 'kind-of-blue', ...overrides };
}

function firstIssueFor(overrides: Partial<RegisterFormValues>): { path: PropertyKey[]; message: string } | undefined {
  const result = registerSchema.safeParse(buildValues(overrides));

  return result.success ? undefined : result.error.issues[0];
}

describe('registerSchema', () => {
  it('accepts valid values and trims the username', () => {
    const result = registerSchema.safeParse(buildValues({ username: ' miles_davis ' }));

    expect(result.success).toBe(true);
    expect(result.data?.username).toBe('miles_davis');
  });

  it.each([
    [{ username: 'ab' }, 'username', 'Username must be at least 3 characters'],
    [{ username: 'a'.repeat(31) }, 'username', 'Username must be at most 30 characters'],
    [{ username: 'miles.davis' }, 'username', 'Username can only contain letters, numbers, and underscores'],
    [{ email: 'miles@' }, 'email', 'Invalid email address'],
    [{ password: '1234567' }, 'password', 'Password must be at least 8 characters'],
  ] as const)('rejects %j on %s with "%s"', (overrides, field, message) => {
    expect(firstIssueFor(overrides)).toMatchObject({ path: [field], message });
  });

  it('accepts a username of exactly 3 and 30 characters', () => {
    expect(registerSchema.safeParse(buildValues({ username: 'abc' })).success).toBe(true);
    expect(registerSchema.safeParse(buildValues({ username: 'a'.repeat(30) })).success).toBe(true);
  });
});
