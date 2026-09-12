'use client';

import type { ReactNode } from 'react';
import { defaultTheme, mergeTheme, ThemeProvider } from 'evergreen-ui';

const GREEN = '#008001'; // hoagiemeal-dark-green
const FONT_STACK =
  'var(--font-poppins), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const primaryTabSelectors = defaultTheme.components.Tab.appearances.primary.selectors;

const Tab = {
  ...defaultTheme.components.Tab,
  appearances: {
    ...defaultTheme.components.Tab.appearances,
    primary: {
      ...defaultTheme.components.Tab.appearances.primary,
      selectors: {
        ...primaryTabSelectors,
        _before: { ...primaryTabSelectors?._before, backgroundColor: GREEN },
        _current: { ...primaryTabSelectors?._current, color: GREEN, '&:focus': { color: GREEN } },
        _focus: { boxShadow: 'none' },
      },
    },
  },
};

/** Evergreen theme with Hoagie's greens and greys. Green shades follow Tailwind's green scale. */
export const hoagieTheme = mergeTheme(defaultTheme, {
  title: 'green',
  colors: {
    ...defaultTheme.colors,
    gray900: '#000000',
    gray800: '#343434',
    gray700: '#808080',
    gray600: '#808080',
    gray500: '#D2D2D2',
    gray400: '#D2D2D2',
    gray300: '#EEEEEE',
    gray200: '#F1F1F1',
    gray100: '#F7F7F7',
    gray90: '#FBFBFB',
    gray75: '#FCFCFC',
    gray50: '#FFFFFF',
    green900: '#052e16',
    green800: '#14532d',
    green700: '#166534',
    green600: '#15803d',
    green500: '#16a34a',
    green400: '#22c55e',
    green300: '#4ade80',
    green200: '#86efac',
    green100: '#bbf7d0',
    green50: '#dcfce7',
    green25: '#f0fdf4',
    red700: '#7D2828',
    red600: '#A73636',
    red500: '#D14343',
    red300: '#EE9191',
    red100: '#F9DADA',
    red25: '#FDF4F4',
    orange700: '#996A13',
    orange500: '#FFB020',
    orange100: '#F8E3DA',
    orange25: '#FFFAF2',
    purple600: '#6E62B6',
    purple100: '#E7E4F9',
    teal800: '#0F5156',
    teal300: '#7CE0E6',
    teal100: '#D3F5F7',
    yellow800: '#66460D',
    yellow300: '#FFD079',
    yellow200: '#FFDFA6',
    yellow100: '#FFEFD2',
    rblue300: '#85A3FF',
    muted: '#808080',
    default: '#343434',
    dark: '#000000',
    selected: GREEN,
    tint1: '#f0fdf4',
    tint2: '#f0fdf4',
    overlay: 'rgba(5, 46, 22, 0.7)',
    yellowTint: '#FFEFD2',
    greenTint: '#f0fdf4',
    orangeTint: '#FFFAF2',
    redTint: '#FDF4F4',
    blueTint: '#F3F6FF',
    purpleTint: '#E7E4F9',
    tealTint: '#D3F5F7',
    border: { default: '#EEEEEE', muted: '#F1F1F1' },
    icon: { default: '#808080', muted: '#D2D2D2', disabled: '#D2D2D2', selected: GREEN },
    text: { danger: '#D14343', success: GREEN, info: GREEN },
    'hoagie-orange': '#DE7548',
  },
  fills: {
    ...defaultTheme.fills,
    neutral: { color: '#343434', backgroundColor: '#F1F1F1' },
    green: { color: '#15803d', backgroundColor: '#bbf7d0' },
    red: { color: '#7D2828', backgroundColor: '#F9DADA' },
    orange: { color: '#BC5E00', backgroundColor: '#FFE3C6' },
    yellow: { color: '#66460D', backgroundColor: '#FFEFD2' },
    teal: { color: '#0F5156', backgroundColor: '#D3F5F7' },
    purple: { color: '#6C47AE', backgroundColor: '#E9DDFE' },
  },
  intents: {
    ...defaultTheme.intents,
    info: { background: '#f0fdf4', border: GREEN, text: '#15803d', icon: GREEN },
    success: { background: '#f0fdf4', border: GREEN, text: '#166534', icon: GREEN },
    warning: { background: '#FFFAF2', border: '#FFB020', text: '#996A13', icon: '#FFB020' },
    danger: { background: '#FDF4F4', border: '#D14343', text: '#A73636', icon: '#D14343' },
  },
  radii: { ...defaultTheme.radii, 0: '0px', 1: '4px', 2: '8px' },
  shadows: {
    ...defaultTheme.shadows,
    0: '0 0 1px rgba(16, 38, 30, 0.3)',
    1: '0 0 1px rgba(16, 38, 30, 0.3), 0 2px 4px -2px rgba(16, 38, 30, 0.47)',
    2: '0 0 1px rgba(16, 38, 30, 0.3), 0 5px 8px -4px rgba(16, 38, 30, 0.47)',
    3: '0 0 1px rgba(16, 38, 30, 0.3), 0 8px 10px -4px rgba(16, 38, 30, 0.47)',
    4: '0 0 1px rgba(16, 38, 30, 0.3), 0 16px 24px -8px rgba(16, 38, 30, 0.47)',
    focusRing: '0 0 0 2px #DCF2EA',
  },
  fontFamilies: {
    ...defaultTheme.fontFamilies,
    display: FONT_STACK,
    ui: FONT_STACK,
    mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
  },
  fontSizes: {
    ...defaultTheme.fontSizes,
    0: '10px',
    1: '12px',
    2: '14px',
    3: '16px',
    4: '18px',
    5: '20px',
    6: '24px',
    7: '32px',
    body: '14px',
    caption: '10px',
    heading: '16px',
  },
  fontWeights: { ...defaultTheme.fontWeights, light: 300, normal: 400, semibold: 500, bold: 600 },
  components: { ...defaultTheme.components, Tab },
});

export default function Theme({ children }: { children: ReactNode }) {
  return <ThemeProvider value={hoagieTheme}>{children}</ThemeProvider>;
}
