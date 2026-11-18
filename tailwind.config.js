/** @type {import('tailwindcss').Config} */

const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

const COLOR_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'card-elevated',
  'surface-hover',
  'primary',
  'primary-foreground',
  'primary-text',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'text-soft',
  'border',
  'border-strong',
  'input',
  'ring',
  'destructive',
  'destructive-foreground',
  'accent',
  'accent-foreground',
  'event',
  'event-foreground',
  'tab-bar',
];

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(COLOR_TOKENS.map((name) => [name, token(name)])),
      // DESIGN.md §4 radius scale: sm tags, md icon buttons, lg buttons / inputs, xl hero cards, full chips and avatars.
      borderRadius: {
        none: '0px',
        sm: '6px',
        DEFAULT: '12px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '24px',
        '3xl': '28px',
        full: '9999px',
      },
      // DESIGN.md §3: the Text primitive (src/components/ui/text.tsx) picks the exact face per size and weight.
      fontFamily: {
        sans: ['Archivo_700Bold'],
        mono: ['IBMPlexMono_400Regular'],
      },
      // DESIGN.md §3 type scale: xs label, sm meta, base body, lg subheading, xl heading, 2xl title, 3xl display.
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '21px' }],
        xl: ['24px', { lineHeight: '28px' }],
        '2xl': ['32px', { lineHeight: '34px' }],
        '3xl': ['44px', { lineHeight: '44px' }],
      },
      // DESIGN.md §4: glow is the only shadow; grey drop shadows compile to nothing.
      boxShadow: {
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        glow: '0 0 22px rgba(255, 46, 136, 0.7)',
        'glow-accent': '0 0 22px rgba(34, 227, 255, 0.6)',
      },
      letterSpacing: {
        label: '1.32px', // 0.12em at 11px
        button: '0.9px', // 0.06em at 15px
        display: '1.32px', // 0.03em at 44px
      },
    },
  },
  plugins: [],
};
