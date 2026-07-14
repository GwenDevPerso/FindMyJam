import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { Redirect, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { Loading } from '@/components/feedback/loading';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { startAuthListener } from '@/lib/supabase/auth-listener';

type AuthProviderProps = {
  children: ReactNode;
};

function AuthLoadingScreen(): React.JSX.Element {
  return <Loading size="large" fullScreen={true} />;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    const stopAuthListener = startAuthListener();

    return (): void => {
      stopAuthListener();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/" />;
  }

  return <View style={{ flex: 1 }}>{children}</View>;
}
