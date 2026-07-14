import type { Session } from '@supabase/supabase-js';

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthState = {
  session: Session | null;
  user: AuthUser | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  username: string;
};
