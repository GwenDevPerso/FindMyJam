import { Colors, type ColorScheme, type ThemeColors } from '@/constants/theme';

// DESIGN.md: dark only, whatever the system setting.
export function useAppColorScheme(): ColorScheme {
  return 'dark';
}

export function useTheme(): ThemeColors {
  const colorScheme = useAppColorScheme();

  return Colors[colorScheme];
}

export function useIsDarkMode(): boolean {
  const colorScheme = useAppColorScheme();

  return colorScheme === 'dark';
}
