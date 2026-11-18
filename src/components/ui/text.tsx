import { StyleSheet, Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { FontFaces, type FontFamily, type FontWeight } from '@/constants/theme';

type TextProps = NativeTextProps & {
  className?: string;
};

// DESIGN.md §3: heading, title and display sizes are sans (Archivo); body, label and caption are mono (IBM Plex Mono).
const SANS_SIZE = /(^|\s)text-(lg|xl|2xl|3xl)(\s|$)/;
const EXPLICIT_FAMILY = /(^|\s)font-(sans|mono)(\s|$)/;
const WEIGHT = /(^|\s)font-(normal|medium|semibold|bold|extrabold)(\s|$)/;

const faceStyles = StyleSheet.create(
  Object.fromEntries(
    (Object.keys(FontFaces) as FontFamily[]).flatMap((family) =>
      (Object.keys(FontFaces[family]) as FontWeight[]).map((weight) => [
        `${family}-${weight}`,
        // fontWeight stays normal: each face is its own family, and a weight on top would fake-bold it.
        { fontFamily: FontFaces[family][weight], fontWeight: 'normal' as const },
      ]),
    ),
  ),
);

function resolveFace(className: string): string {
  const explicitFamily = EXPLICIT_FAMILY.exec(className)?.[2] as FontFamily | undefined;
  const family: FontFamily = explicitFamily ?? (SANS_SIZE.test(className) ? 'sans' : 'mono');
  const weight = (WEIGHT.exec(className)?.[2] as FontWeight | undefined) ?? 'normal';

  return `${family}-${weight}`;
}

/** The app's only text component: picks the DESIGN.md font face (family + weight) from the className. */
export function Text({ className, style, ...textProps }: TextProps): React.JSX.Element {
  return (
    <NativeText className={className} style={[faceStyles[resolveFace(className ?? '')], style]} {...textProps} />
  );
}
