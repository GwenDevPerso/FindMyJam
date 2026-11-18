import { Platform } from 'react-native';

// DESIGN.md §2 palette (Neon night, dark only), mirrored from src/global.css for React Navigation and native props
// (icon `color`, …). Raw values live only here and in global.css.
const palette = {
  night: '#0b0716',
  nightSurface: '#140c26',
  nightHover: '#1d1236',
  snow: '#f4ecff',
  snowSoft: '#d9ccef',
  snowMuted: '#b9a8d6',
  line: '#2a1c44',
  lineStrong: '#6e5c94',
  pink: '#ff2e88',
  ink: '#12051f',
  cyan: '#22e3ff',
  green: '#5dff9e',
  orange: '#ff7a45',
} as const;

const night = {
  text: palette.snow,
  textSoft: palette.snowSoft,
  textMuted: palette.snowMuted,
  textSecondary: palette.snowMuted,
  background: palette.night,
  surface: palette.nightSurface,
  surfaceHover: palette.nightHover,
  backgroundElement: palette.nightHover,
  backgroundSelected: palette.lineStrong,
  primary: palette.pink,
  primaryForeground: palette.ink,
  primaryText: palette.pink,
  card: palette.nightSurface,
  cardElevated: palette.nightSurface,
  cardForeground: palette.snow,
  border: palette.line,
  borderStrong: palette.lineStrong,
  destructive: palette.orange,
  destructiveForeground: palette.ink,
  muted: palette.nightHover,
  mutedForeground: palette.snowMuted,
  ring: palette.cyan,
  accent: palette.cyan,
  accentForeground: palette.ink,
  event: palette.green,
  tabBar: palette.nightSurface,
} as const;

// Dark only (DESIGN.md): both keys hold the night theme, so code reading Colors[scheme] always gets it.
export const Colors = {
  light: night,
  dark: night,
} as const;

// DESIGN.md §4: glow is the only shadow (RN `boxShadow`), on the primary action, a selection or a live state.
export const Glow = {
  primary: '0 0 22px rgba(255, 46, 136, 0.7)',
  accent: '0 0 22px rgba(34, 227, 255, 0.6)',
} as const;

// DESIGN.md §4 horizon gradient, used only by src/components/ui/horizon.tsx.
export const HorizonGradient = ['#1b0830', '#4a1250', '#b8325f', '#ff7a45'] as const;

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

// Mirrors the native splash `backgroundColor` in app.json (= `background`) so the animated overlay hands off seamlessly.
export const SplashBackground = '#0b0716';

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
