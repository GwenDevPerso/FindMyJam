import type { AuthError, Session } from '@supabase/supabase-js';

import { AppError } from '@/lib/errors/app-error';
import { mapSupabaseError } from '@/lib/errors/map-supabase-error';
import {
  authRepository,
  type SignInParams,
  type SignUpParams,
} from '@/repositories/auth.repository';

export type AuthSession = Session;

function assertNoError(error: AuthError | null): void {
  if (error !== null) {
    throw mapSupabaseError(error);
  }
}

function assertSession(session: Session | null): Session {
  if (session === null) {
    throw new AppError('UNAUTHORIZED', 'No active session', 401);
  }

  return session;
}

export const authService = {
  signUp: async (params: SignUpParams): Promise<AuthSession> => {
    const { session, error } = await authRepository.signUp(params);
    assertNoError(error);

    if (session === null) {
      throw new AppError(
        'UNAUTHORIZED',
        'Account created. Check your email to confirm your address before signing in.',
        401,
      );
    }

    return session;
  },

  signIn: async (params: SignInParams): Promise<AuthSession> => {
    const { session, error } = await authRepository.signInWithPassword(params);
    assertNoError(error);

    return assertSession(session);
  },

  signOut: async (): Promise<void> => {
    const { error } = await authRepository.signOut();
    assertNoError(error);
  },

  getSession: async (): Promise<Session | null> => {
    const { session, error } = await authRepository.getSession();
    assertNoError(error);

    return session;
  },

  refreshSession: async (): Promise<AuthSession> => {
    const { session, error } = await authRepository.refreshSession();
    assertNoError(error);

    return assertSession(session);
  },
};
