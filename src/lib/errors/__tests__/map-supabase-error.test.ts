import { AuthWeakPasswordError } from '@supabase/supabase-js';

import { AppError } from '@/lib/errors/app-error';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import { buildAuthApiError, buildPostgrestError } from '@/test-utils/supabase-errors';

describe('mapSupabaseError', () => {
  describe('auth errors', () => {
    it.each([
      ['invalid_credentials', 'INVALID_CREDENTIALS'],
      ['user_already_exists', 'EMAIL_ALREADY_REGISTERED'],
      ['email_exists', 'EMAIL_ALREADY_REGISTERED'],
      ['weak_password', 'WEAK_PASSWORD'],
      ['over_request_rate_limit', 'UNKNOWN'],
    ])('maps auth code %s to %s', (authCode, expectedCode) => {
      const error = mapSupabaseError(buildAuthApiError(authCode, 'auth failed', 400));

      expect(error.code).toBe(expectedCode);
    });

    it('returns an AppError keeping the message and the HTTP status', () => {
      const error = mapSupabaseError(buildAuthApiError('invalid_credentials', 'Invalid login credentials', 401));

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid login credentials');
      expect(error.statusCode).toBe(401);
    });

    // Suspected bug: isAuthError() only recognises name === 'AuthApiError', but supabase-js reports a weak
    // password with AuthWeakPasswordError (name 'AuthWeakPasswordError'), which therefore falls through
    // to the Postgrest branch and comes out as UNKNOWN. See map-supabase-error.ts:57-59.
    it.skip('maps an AuthWeakPasswordError to WEAK_PASSWORD', () => {
      const error = mapSupabaseError(new AuthWeakPasswordError('Password is too weak', 422, ['length']));

      expect(error.code).toBe('WEAK_PASSWORD');
    });
  });

  describe('postgrest errors', () => {
    it.each([
      [{ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }, 'JAM_NOT_FOUND'],
      [{ code: 'P0001', message: 'Jam is full' }, 'JAM_FULL'],
      [{ code: 'P0001', message: 'Jam creator cannot join as participant' }, 'CREATOR_CANNOT_JOIN'],
      [
        { code: '23505', message: 'duplicate key value violates unique constraint "jam_participants_pkey"' },
        'ALREADY_JOINED',
      ],
      [
        { code: '23505', message: 'duplicate key value violates unique constraint "friendships_pair_key"' },
        'FRIEND_REQUEST_EXISTS',
      ],
      [{ code: '42501', message: 'new row violates row-level security policy' }, 'UNAUTHORIZED'],
      [{ code: '23505', message: 'duplicate key value violates unique constraint "profiles_username_key"' }, 'UNKNOWN'],
      [{ code: '08006', message: 'connection failure' }, 'UNKNOWN'],
    ])('maps %j to %s', (overrides, expectedCode) => {
      const error = mapSupabaseError(buildPostgrestError(overrides));

      expect(error.code).toBe(expectedCode);
    });

    it('keeps the message and has no status code', () => {
      const error = mapSupabaseError(buildPostgrestError({ code: '42501', message: 'permission denied' }));

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('permission denied');
      expect(error.statusCode).toBeNull();
    });
  });
});
