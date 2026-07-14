import { Colors, type ColorScheme, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function resolveColorScheme(scheme: ReturnType<typeof useColorScheme>): ColorScheme {
  if (scheme === 'dark') {
    return 'dark';
  }

  return 'light';
}

export function useAppColorScheme(): ColorScheme {
  const scheme = useColorScheme();

  return resolveColorScheme(scheme);
}

export function useTheme(): ThemeColors {
  const colorScheme = useAppColorScheme();

  return Colors[colorScheme];
}

export function useIsDarkMode(): boolean {
  const colorScheme = useAppColorScheme();

  return colorScheme === 'dark';
}
