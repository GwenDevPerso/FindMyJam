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
  darkMode: 'media',
  theme: {
    extend: {
      colors: Object.fromEntries(COLOR_TOKENS.map((name) => [name, token(name)])),
      // DESIGN.md §4: radius 0 everywhere (keys kept so existing classes compile).
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      // DESIGN.md §3: the Text primitive (src/components/ui/text.tsx) picks the exact face per weight.
      fontFamily: {
        sans: ['Archivo_700Bold'],
        mono: ['IBMPlexMono_400Regular'],
      },
      // DESIGN.md §3 type scale: xs = label/caption, sm/base = body, lg/xl = heading, 2xl = title, 3xl = display.
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['13px', { lineHeight: '20px' }],
        lg: ['18px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '24px' }],
        '2xl': ['32px', { lineHeight: '36px' }],
        '3xl': ['40px', { lineHeight: '44px' }],
      },
      // DESIGN.md §4: no elevation; shadow-* classes compile to nothing.
      boxShadow: { sm: 'none', DEFAULT: 'none', md: 'none', lg: 'none', xl: 'none', '2xl': 'none' },
      letterSpacing: {
        label: '0.88px', // 0.08em at 11px
        tight: '-0.5px',
      },
    },
  },
  plugins: [],
};
