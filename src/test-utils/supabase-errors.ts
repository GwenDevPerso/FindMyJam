import { AuthApiError, PostgrestError } from '@supabase/supabase-js';

type PostgrestErrorOverrides = {
  code?: string;
  message?: string;
};

export function buildPostgrestError(overrides: PostgrestErrorOverrides): PostgrestError {
  return new PostgrestError({
    message: overrides.message ?? 'database error',
    details: '',
    hint: '',
    code: overrides.code ?? 'XX000',
  });
}

export function buildAuthApiError(code: string, message: string, status: number): AuthApiError {
  return new AuthApiError(message, status, code);
}
