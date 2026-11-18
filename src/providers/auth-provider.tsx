import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono/600SemiBold';
import { SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk/400Regular';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { useFonts } from 'expo-font';
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

// DESIGN.md §3 faces; the keys are the family names used by FontFaces in src/constants/theme.ts.
const APP_FONTS = {
  Anton_400Regular,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
};

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);
  // A font that fails to load falls back to the system font rather than blocking the app.
  const isLoading = isAuthLoading || (!fontsLoaded && fontError === null);
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

  return <View className="flex-1">{children}</View>;
}
