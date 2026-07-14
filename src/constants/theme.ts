import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0c0c12',
    background: '#fafafc',
    backgroundElement: '#f0f0f5',
    backgroundSelected: '#e6e6ee',
    textSecondary: '#646478',
    primary: '#1db954',
    primaryForeground: '#000000',
    card: '#ffffff',
    cardElevated: '#f5f5f8',
    cardForeground: '#0c0c12',
    border: '#dcdce6',
    destructive: '#f65858',
    destructiveForeground: '#ffffff',
    muted: '#e6e6ee',
    mutedForeground: '#646478',
    ring: '#1db954',
    accent: '#5865f2',
    accentForeground: '#ffffff',
    event: '#f65858',
    tabBar: '#ffffff',
  },
  dark: {
    text: '#f5f5fa',
    background: '#0a0a0f',
    backgroundElement: '#252530',
    backgroundSelected: '#2a2a35',
    textSecondary: '#8c8ca0',
    primary: '#1ed760',
    primaryForeground: '#000000',
    card: '#16161d',
    cardElevated: '#1c1c26',
    cardForeground: '#f5f5fa',
    border: '#2a2a35',
    destructive: '#f87171',
    destructiveForeground: '#450a0a',
    muted: '#2a2a35',
    mutedForeground: '#8c8ca0',
    ring: '#1ed760',
    accent: '#5865f2',
    accentForeground: '#ffffff',
    event: '#f65858',
    tabBar: '#101016',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorScheme = 'light' | 'dark';
export type ThemeColors = (typeof Colors)[ColorScheme];

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 84, android: 72 }) ?? 0;
export const MaxContentWidth = 800;

export const NavigationTheme = {
  light: {
    background: Colors.light.background,
    card: Colors.light.card,
    border: Colors.light.border,
    primary: Colors.light.primary,
    text: Colors.light.text,
  },
  dark: {
    background: Colors.dark.background,
    card: Colors.dark.card,
    border: Colors.dark.border,
    primary: Colors.dark.primary,
    text: Colors.dark.text,
  },
} as const;
