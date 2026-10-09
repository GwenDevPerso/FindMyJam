import { loginSchema } from '@/features/auth/schemas/login.schema';

describe('loginSchema', () => {
  it('accepts an email and a password of 8 characters', () => {
    const result = loginSchema.safeParse({ email: 'miles@example.com', password: '12345678' });

    expect(result.success).toBe(true);
  });

  it('rejects a malformed email', () => {
    const result = loginSchema.safeParse({ email: 'miles.example.com', password: '12345678' });

    expect(result.error?.issues[0]).toMatchObject({ path: ['email'], message: 'Invalid email address' });
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({ email: 'miles@example.com', password: '1234567' });

    expect(result.error?.issues[0]).toMatchObject({
      path: ['password'],
      message: 'Password must be at least 8 characters',
    });
  });

  it('rejects a missing password', () => {
    expect(loginSchema.safeParse({ email: 'miles@example.com' }).success).toBe(false);
  });
});
