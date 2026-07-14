import type { AuthError, Session, User } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';

export type SignUpParams = {
  email: string;
  password: string;
  username: string;
};

export type SignInParams = {
  email: string;
  password: string;
};

export type AuthSessionResult = {
  session: Session | null;
  error: AuthError | null;
};

export type AuthUserResult = {
  user: User | null;
  error: AuthError | null;
};

export const authRepository = {
  signUp: async (params: SignUpParams): Promise<AuthSessionResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          username: params.username,
        },
      },
    });

    return { session: data.session, error };
  },

  signInWithPassword: async (params: SignInParams): Promise<AuthSessionResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    return { session: data.session, error };
  },

  signOut: async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut();

    return { error };
  },

  getSession: async (): Promise<AuthSessionResult> => {
    const { data, error } = await supabase.auth.getSession();

    return { session: data.session, error };
  },

  refreshSession: async (): Promise<AuthSessionResult> => {
    const { data, error } = await supabase.auth.refreshSession();

    return { session: data.session, error };
  },

  getUser: async (): Promise<AuthUserResult> => {
    const { data, error } = await supabase.auth.getUser();

    return { user: data.user, error };
  },
};
