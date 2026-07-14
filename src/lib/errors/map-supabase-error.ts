import { AuthError, PostgrestError } from '@supabase/supabase-js';

import { AppError, type AppErrorCode } from '@/lib/errors/app-error';

function mapAuthErrorCode(error: AuthError): AppErrorCode {
  switch (error.code) {
    case 'invalid_credentials':
      return 'INVALID_CREDENTIALS';
    case 'user_already_exists':
    case 'email_exists':
      return 'EMAIL_ALREADY_REGISTERED';
    case 'weak_password':
      return 'WEAK_PASSWORD';
    default:
      return 'UNKNOWN';
  }
}

function mapPostgrestErrorCode(error: PostgrestError): AppErrorCode {
  const message = error.message.toLowerCase();

  if (error.code === 'PGRST116') {
    return 'JAM_NOT_FOUND';
  }

  if (message.includes('is full')) {
    return 'JAM_FULL';
  }

  if (message.includes('creator cannot join')) {
    return 'CREATOR_CANNOT_JOIN';
  }

  if (error.code === '23505' && message.includes('jam_participants')) {
    return 'ALREADY_JOINED';
  }

  if (error.code === '23505' && message.includes('friendships')) {
    return 'FRIEND_REQUEST_EXISTS';
  }

  if (error.code === '42501') {
    return 'UNAUTHORIZED';
  }

  return 'UNKNOWN';
}

function getStatusCode(error: AuthError | PostgrestError): number | null {
  if ('status' in error && typeof error.status === 'number') {
    return error.status;
  }

  return null;
}

function isAuthError(error: AuthError | PostgrestError): error is AuthError {
  return error.name === 'AuthApiError';
}

export function mapSupabaseError(error: AuthError | PostgrestError): AppError {
  const code = isAuthError(error) ? mapAuthErrorCode(error) : mapPostgrestErrorCode(error);
  const statusCode = getStatusCode(error);

  return new AppError(code, error.message, statusCode);
}
