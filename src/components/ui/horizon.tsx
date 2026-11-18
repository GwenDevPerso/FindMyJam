import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';

import { HorizonGradient, HorizonSun } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/utils/cn';

export type HorizonVariant = 'card' | 'header';

type HorizonProps = {
  variant: HorizonVariant;
  className?: string;
};

// DESIGN.md §4 signature decor, all in react-native-svg (no extra native module): sunset sky, hard line to
// `background`, a striped sun and a perspective grid in `secondaryAccent` at 45 %. Decorative only, hidden from
// screen readers. Used on the Home hero card and the Jam detail header, nowhere else.
const heightClasses: Record<HorizonVariant, string> = {
  card: 'h-28',
  header: 'h-48',
};

// Stops of HorizonGradient: sky, sky, glow, horizon line, then the ground.
const GRADIENT_LOCATIONS = [0, 0.4, 0.62, 0.68, 0.685, 1] as const;
const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 100;
const HORIZON_Y = 68;
const SUN_RADIUS = 30;
const SUN_STRIPES = [52, 58, 63, 67];
const GRID_ROWS = [72, 77, 84, 93];
const GRID_COLUMNS = [-60, -30, -10, 10, 30, 50, 70, 90, 110, 130, 160];

export function Horizon({ variant, className }: HorizonProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
      className={cn('w-full overflow-hidden', heightClasses[variant], className)}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} preserveAspectRatio="none">
        <Defs>
          <SvgGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            {HorizonGradient.map((color, index) => (
              <Stop key={GRADIENT_LOCATIONS[index]} offset={GRADIENT_LOCATIONS[index]} stopColor={color} />
            ))}
          </SvgGradient>
          <SvgGradient id="sun" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={HorizonSun[0]} />
            <Stop offset="0.55" stopColor={HorizonSun[1]} />
            <Stop offset="1" stopColor={HorizonSun[2]} />
          </SvgGradient>
        </Defs>
        <Rect x={0} y={0} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#sky)" />
        <Circle cx={VIEWBOX_WIDTH / 2} cy={HORIZON_Y} r={SUN_RADIUS} fill="url(#sun)" />
        {SUN_STRIPES.map((y) => (
          <Rect key={y} x={0} y={y} width={VIEWBOX_WIDTH} height={1.6} fill={HorizonGradient[2]} />
        ))}
        <Rect x={0} y={HORIZON_Y} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT - HORIZON_Y} fill={theme.background} />
        {GRID_ROWS.map((y) => (
          <Line key={y} x1={0} y1={y} x2={VIEWBOX_WIDTH} y2={y} stroke={theme.accent} strokeOpacity={0.45} strokeWidth={0.4} />
        ))}
        {GRID_COLUMNS.map((x) => (
          <Line
            key={x}
            x1={VIEWBOX_WIDTH / 2}
            y1={HORIZON_Y}
            x2={x}
            y2={VIEWBOX_HEIGHT}
            stroke={theme.accent}
            strokeOpacity={0.45}
            strokeWidth={0.4}
          />
        ))}
      </Svg>
    </View>
  );
}
