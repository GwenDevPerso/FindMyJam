import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_500Medium } from '@expo-google-fonts/archivo/500Medium';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { IBMPlexMono_700Bold } from '@expo-google-fonts/ibm-plex-mono/700Bold';
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
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
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
