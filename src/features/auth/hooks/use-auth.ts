import type { Session } from '@supabase/supabase-js';

import { useLogin } from '@/features/auth/hooks/use-login';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { useRefreshSession } from '@/features/auth/hooks/use-refresh-session';
import { useRegister } from '@/features/auth/hooks/use-register';
import type { AuthState, AuthUser, LoginInput, RegisterInput } from '@/features/auth/types';
import { useAuthStore } from '@/store/auth.store';

function mapSessionUser(session: Session | null): AuthUser | null {
  if (session === null) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? null,
  };
}

export function useAuth(): AuthState & {
  login: (input: LoginInput) => Promise<Session>;
  register: (input: RegisterInput) => Promise<Session>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<Session>;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isLoggingOut: boolean;
  isRefreshing: boolean;
  loginError: Error | null;
  registerError: Error | null;
  logoutError: Error | null;
} {
  const session = useAuthStore((state) => state.session);
  const userId = useAuthStore((state) => state.userId);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const refreshSessionMutation = useRefreshSession();

  return {
    session,
    user: mapSessionUser(session),
    userId,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refreshSession: refreshSessionMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRefreshing: refreshSessionMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
  };
}
