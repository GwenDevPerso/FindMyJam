import { StyleSheet, Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { FontFaces, type FontFamily, type FontWeight } from '@/constants/theme';

type TextProps = NativeTextProps & {
  className?: string;
};

// DESIGN.md §3: heading, title and display sizes are Anton, uppercase; everything else is Space Grotesk, and
// `font-mono` (labels, data) is JetBrains Mono.
const DISPLAY_SIZE = /(^|\s)text-(xl|2xl|3xl)(\s|$)/;
const EXPLICIT_FAMILY = /(^|\s)font-(display|sans|mono)(\s|$)/;
const WEIGHT = /(^|\s)font-(normal|medium|semibold|bold|extrabold)(\s|$)/;

const faceStyles = StyleSheet.create(
  Object.fromEntries(
    (Object.keys(FontFaces) as FontFamily[]).flatMap((family) =>
      (Object.keys(FontFaces[family]) as FontWeight[]).map((weight) => [
        `${family}-${weight}`,
        // fontWeight stays normal: each face is its own family, and a weight on top would fake-bold it.
        // Anton titles are uppercase by style (DESIGN.md §8), never in the strings.
        family === 'display'
          ? { fontFamily: FontFaces[family][weight], fontWeight: 'normal' as const, textTransform: 'uppercase' as const }
          : { fontFamily: FontFaces[family][weight], fontWeight: 'normal' as const },
      ]),
    ),
  ),
);

function resolveFace(className: string): string {
  const explicitFamily = EXPLICIT_FAMILY.exec(className)?.[2] as FontFamily | undefined;
  const family: FontFamily = explicitFamily ?? (DISPLAY_SIZE.test(className) ? 'display' : 'sans');
  const weight = (WEIGHT.exec(className)?.[2] as FontWeight | undefined) ?? 'normal';

  return `${family}-${weight}`;
}

/** The app's only text component: picks the DESIGN.md font face (family + weight) from the className. */
export function Text({ className, style, ...textProps }: TextProps): React.JSX.Element {
  return (
    <NativeText className={className} style={[faceStyles[resolveFace(className ?? '')], style]} {...textProps} />
  );
}
