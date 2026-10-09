import type { Session } from '@supabase/supabase-js';

import { authRepository } from '@/repositories/auth.repository';
import { authService } from '@/services/auth.service';
import { buildAuthApiError } from '@/test-utils/supabase-errors';

jest.mock('@/repositories/auth.repository');

const mockedAuthRepository = jest.mocked(authRepository);

const session = {
  access_token: 'access-token',
  user: { id: '11111111-1111-4111-8111-111111111111', email: 'miles@example.com' },
} as unknown as Session;

const credentials = { email: 'miles@example.com', password: 'kind-of-blue' };

describe('authService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('signIn', () => {
    it('returns the session for valid credentials', async () => {
      mockedAuthRepository.signInWithPassword.mockResolvedValue({ session, error: null });

      await expect(authService.signIn(credentials)).resolves.toBe(session);
      expect(mockedAuthRepository.signInWithPassword).toHaveBeenCalledWith(credentials);
    });

    it('throws INVALID_CREDENTIALS for a wrong password', async () => {
      mockedAuthRepository.signInWithPassword.mockResolvedValue({
        session: null,
        error: buildAuthApiError('invalid_credentials', 'Invalid login credentials', 400),
      });

      await expect(authService.signIn(credentials)).rejects.toMatchObject({
        name: 'AppError',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid login credentials',
        statusCode: 400,
      });
    });

    it('throws UNAUTHORIZED when no session comes back', async () => {
      mockedAuthRepository.signInWithPassword.mockResolvedValue({ session: null, error: null });

      await expect(authService.signIn(credentials)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        statusCode: 401,
      });
    });
  });

  describe('signUp', () => {
    const params = { ...credentials, username: 'miles' };

    it('returns the session of the new account', async () => {
      mockedAuthRepository.signUp.mockResolvedValue({ session, error: null });

      await expect(authService.signUp(params)).resolves.toBe(session);
      expect(mockedAuthRepository.signUp).toHaveBeenCalledWith(params);
    });

    it('throws EMAIL_ALREADY_REGISTERED when the email is taken', async () => {
      mockedAuthRepository.signUp.mockResolvedValue({
        session: null,
        error: buildAuthApiError('user_already_exists', 'User already registered', 422),
      });

      await expect(authService.signUp(params)).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_REGISTERED',
      });
    });

    it('asks the user to confirm their email when sign-up returns no session', async () => {
      mockedAuthRepository.signUp.mockResolvedValue({ session: null, error: null });

      await expect(authService.signUp(params)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Account created. Check your email to confirm your address before signing in.',
      });
    });
  });

  describe('signOut', () => {
    it('resolves when sign-out succeeds', async () => {
      mockedAuthRepository.signOut.mockResolvedValue({ error: null });

      await expect(authService.signOut()).resolves.toBeUndefined();
    });

    it('throws the mapped AppError when sign-out fails', async () => {
      mockedAuthRepository.signOut.mockResolvedValue({
        error: buildAuthApiError('session_not_found', 'Session not found', 403),
      });

      await expect(authService.signOut()).rejects.toMatchObject({
        name: 'AppError',
        code: 'UNKNOWN',
        statusCode: 403,
      });
    });
  });

  describe('getSession', () => {
    it('returns null when nobody is signed in', async () => {
      mockedAuthRepository.getSession.mockResolvedValue({ session: null, error: null });

      await expect(authService.getSession()).resolves.toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('throws UNAUTHORIZED when there is no session to refresh', async () => {
      mockedAuthRepository.refreshSession.mockResolvedValue({ session: null, error: null });

      await expect(authService.refreshSession()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
  });
});
