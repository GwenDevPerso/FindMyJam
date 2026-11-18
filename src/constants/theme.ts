import { Platform } from 'react-native';

// DESIGN.md §2 palette, mirrored from src/global.css for React Navigation and native props (icon `color`, …).
// Raw values live only here and in global.css.
const palette = {
  paper: '#f6f4ee',
  white: '#ffffff',
  paperHover: '#efece4',
  ink: '#141410',
  inkSoft: '#4a463d',
  inkMuted: '#6b665a',
  lineLight: '#dcd8cc',
  lineStrongLight: '#857f72',
  night: '#0e0e0c',
  nightSurface: '#141410',
  nightHover: '#1a1915',
  snow: '#edeae2',
  snowSoft: '#b4aea1',
  snowMuted: '#9a9384',
  lineDark: '#26251f',
  lineStrongDark: '#6b665a',
  green: '#1db954',
  dangerLight: '#b23a24',
  dangerDark: '#e8806b',
  blueLight: '#3451c7',
  blueDark: '#d4daff',
} as const;

export const Colors = {
  light: {
    text: palette.ink,
    textSoft: palette.inkSoft,
    textMuted: palette.inkMuted,
    textSecondary: palette.inkMuted,
    background: palette.paper,
    surface: palette.white,
    surfaceHover: palette.paperHover,
    backgroundElement: palette.paperHover,
    backgroundSelected: palette.lineStrongLight,
    primary: palette.green,
    primaryForeground: palette.night,
    primaryText: palette.ink,
    card: palette.white,
    cardElevated: palette.white,
    cardForeground: palette.ink,
    border: palette.lineLight,
    borderStrong: palette.lineStrongLight,
    destructive: palette.dangerLight,
    destructiveForeground: palette.white,
    muted: palette.paperHover,
    mutedForeground: palette.inkMuted,
    ring: palette.ink,
    accent: palette.blueLight,
    accentForeground: palette.white,
    event: palette.ink,
    tabBar: palette.paper,
  },
  dark: {
    text: palette.snow,
    textSoft: palette.snowSoft,
    textMuted: palette.snowMuted,
    textSecondary: palette.snowMuted,
    background: palette.night,
    surface: palette.nightSurface,
    surfaceHover: palette.nightHover,
    backgroundElement: palette.nightHover,
    backgroundSelected: palette.lineStrongDark,
    primary: palette.green,
    primaryForeground: palette.night,
    primaryText: palette.green,
    card: palette.nightSurface,
    cardElevated: palette.nightSurface,
    cardForeground: palette.snow,
    border: palette.lineDark,
    borderStrong: palette.lineStrongDark,
    destructive: palette.dangerDark,
    destructiveForeground: palette.night,
    muted: palette.nightHover,
    mutedForeground: palette.snowMuted,
    ring: palette.green,
    accent: palette.blueDark,
    accentForeground: palette.night,
    event: palette.green,
    tabBar: palette.night,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorScheme = 'light' | 'dark';
export type ThemeColors = (typeof Colors)[ColorScheme];

// DESIGN.md §3 — font faces loaded with expo-font in AuthProvider. One family name per weight: custom fonts do not
// pick a face from fontWeight on native.
export const FontFaces = {
  sans: {
    normal: 'Archivo_400Regular',
    medium: 'Archivo_500Medium',
    semibold: 'Archivo_600SemiBold',
    bold: 'Archivo_700Bold',
    extrabold: 'Archivo_800ExtraBold',
  },
  mono: {
    normal: 'IBMPlexMono_400Regular',
    medium: 'IBMPlexMono_500Medium',
    semibold: 'IBMPlexMono_600SemiBold',
    bold: 'IBMPlexMono_700Bold',
    extrabold: 'IBMPlexMono_700Bold',
  },
} as const;

export type FontFamily = keyof typeof FontFaces;
export type FontWeight = keyof (typeof FontFaces)['sans'];

export const Fonts = {
  sans: FontFaces.sans.bold,
  mono: FontFaces.mono.normal,
} as const;

// DESIGN.md §4 spacing scale (4-pt base).
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Mirrors the native splash `backgroundColor` in app.json so the animated overlay hands off seamlessly.
// Not a DESIGN.md token: the splash (colour + Expo icon) has not been redesigned yet.
export const SplashBackground = '#0e0e0c';

export const BottomTabInset = Platform.select({ ios: 84, android: 72 }) ?? 0;
export const MaxContentWidth = 800;

export const NavigationTheme = {
  light: {
    background: Colors.light.background,
    card: Colors.light.card,
    border: Colors.light.border,
    primary: Colors.light.primaryText,
    text: Colors.light.text,
  },
  dark: {
    background: Colors.dark.background,
    card: Colors.dark.card,
    border: Colors.dark.border,
    primary: Colors.dark.primaryText,
    text: Colors.dark.text,
  },
} as const;
