import {
  Drum,
  Guitar,
  Mic2,
  Music,
  Music2,
  Piano,
  Radio,
  type LucideIcon,
  Wind,
} from 'lucide-react-native';

const INSTRUMENT_ICON_MAP: Record<string, LucideIcon> = {
  guitare: Guitar,
  'guitare-basse': Guitar,
  batterie: Drum,
  piano: Piano,
  clavier: Piano,
  chant: Mic2,
  violon: Music2,
  alto: Music2,
  violoncelle: Music2,
  contrebasse: Music2,
  saxophone: Wind,
  trompette: Wind,
  trombone: Wind,
  flute: Wind,
  clarinette: Wind,
  harmonica: Wind,
  ukulele: Guitar,
  banjo: Guitar,
  'dj-platines': Radio,
  'mao-production': Radio,
};

export function getInstrumentIcon(slug: string): LucideIcon {
  return INSTRUMENT_ICON_MAP[slug] ?? Music;
}
