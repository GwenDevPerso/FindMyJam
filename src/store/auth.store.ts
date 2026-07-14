import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

type AuthStoreState = {
  session: Session | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthStoreActions = {
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
};

type AuthStore = AuthStoreState & AuthStoreActions;

const initialState: AuthStoreState = {
  session: null,
  userId: null,
  isLoading: true,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  setSession: (session: Session | null): void => {
    set({
      session,
      userId: session?.user.id ?? null,
      isAuthenticated: session !== null,
    });
  },

  setLoading: (isLoading: boolean): void => {
    set({ isLoading });
  },

  reset: (): void => {
    set({
      session: null,
      userId: null,
      isLoading: false,
      isAuthenticated: false,
    });
  },
}));
