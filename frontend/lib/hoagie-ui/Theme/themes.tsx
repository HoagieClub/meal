/**
 * @overview Evergreen UI theme configuration with custom colors and component styles.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { defaultTheme, mergeTheme } from 'evergreen-ui';
import Tab from './Tab';

export const hoagieUI = mergeTheme(defaultTheme, {
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
    green900: '#052e16', // Tailwind green-950
    green800: '#14532d', // Tailwind green-900
    green700: '#166534', // Tailwind green-800
    green600: '#15803d', // Tailwind green-700
    green500: '#16a34a', // Tailwind green-600
    green400: '#22c55e', // Tailwind green-500
    green300: '#4ade80', // Tailwind green-400
    green200: '#86efac', // Tailwind green-300
    green100: '#bbf7d0', // Tailwind green-200
    green50: '#dcfce7', // Tailwind green-100
    green25: '#f0fdf4', // Tailwind green-50
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
    selected: '#008001', // hoagiemeal-dark-green
    tint1: '#f0fdf4', // Tailwind green-50
    tint2: '#f0fdf4', // Tailwind green-50
    overlay: 'rgba(5, 46, 22, 0.7)', // updated to match Tailwind green-950
    yellowTint: '#FFEFD2',
    greenTint: '#f0fdf4', // Tailwind green-50
    orangeTint: '#FFFAF2',
    redTint: '#FDF4F4',
    blueTint: '#F3F6FF',
    purpleTint: '#E7E4F9',
    tealTint: '#D3F5F7',
    border: {
      default: '#EEEEEE',
      muted: '#F1F1F1',
    },
    icon: {
      default: '#808080',
      muted: '#D2D2D2',
      disabled: '#D2D2D2',
      selected: '#008001', // hoagiemeal-dark-green
    },
    text: {
      danger: '#D14343',
      success: '#008001', // hoagiemeal-dark-green
      info: '#008001', // hoagiemeal-dark-green
    },
    'hoagie-orange': '#DE7548',
  },
  fills: {
    ...defaultTheme.fills,
    neutral: {
      color: '#343434',
      backgroundColor: '#F1F1F1',
    },
    green: {
      color: '#15803d', // Tailwind green-700
      backgroundColor: '#bbf7d0', // Tailwind green-200
    },
    red: {
      color: '#7D2828',
      backgroundColor: '#F9DADA',
    },
    orange: {
      color: '#BC5E00',
      backgroundColor: '#FFE3C6',
    },
    yellow: {
      color: '#66460D',
      backgroundColor: '#FFEFD2',
    },
    teal: {
      color: '#0F5156',
      backgroundColor: '#D3F5F7',
    },
    purple: {
      color: '#6C47AE',
      backgroundColor: '#E9DDFE',
    },
  },
  intents: {
    ...defaultTheme.intents,
    info: {
      background: '#f0fdf4', // Tailwind green-50
      border: '#008001', // hoagiemeal-dark-green
      text: '#15803d', // Tailwind green-700
      icon: '#008001', // hoagiemeal-dark-green
    },
    success: {
      background: '#f0fdf4', // Tailwind green-50
      border: '#008001', // hoagiemeal-dark-green
      text: '#166534', // Tailwind green-800
      icon: '#008001', // hoagiemeal-dark-green
    },
    warning: {
      background: '#FFFAF2',
      border: '#FFB020',
      text: '#996A13',
      icon: '#FFB020',
    },
    danger: {
      background: '#FDF4F4',
      border: '#D14343',
      text: '#A73636',
      icon: '#D14343',
    },
  },
  radii: {
    ...defaultTheme.radii,
    0: '0px',
    1: '4px',
    2: '8px',
  },
  shadows: {
    ...defaultTheme.shadows,
    0: '0 0 1px rgba(16, 38, 30, 0.3)',
    1: '0 0 1px rgba(16, 38, 30, 0.3), 0 2px 4px -2px rgba(16, 38, 30, 0.47)',
    2: '0 0 1px rgba(16, 38, 30, 0.3), 0 5px 8px -4px rgba(16, 38, 30, 0.47)',
    3: '0 0 1px rgba(16, 38, 30, 0.3), 0 8px 10px -4px rgba(16, 38, 30, 0.47)',
    4: '0 0 1px rgba(16, 38, 30, 0.3), 0 16px 24px -8px rgba(16, 38, 30, 0.47)',
    focusRing: '0 0 0 2px #86efac', // Tailwind green-300
  },
  fontFamilies: {
    ...defaultTheme.fontFamilies,
    display:
      '"Poppins", "SF UI Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    ui: '"Poppins", "SF UI Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    mono: '"JetBrains Mono", "SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace',
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
  fontWeights: {
    ...defaultTheme.fontWeights,
    light: 300,
    normal: 400,
    semibold: 500,
    bold: 600,
  },
  components: {
    ...defaultTheme.components,
    Tab,
  },
});

export const hoagieGreen = mergeTheme(hoagieUI, {
  title: 'green',
  colors: {
    ...hoagieUI.colors,
    selected: '#008001', // hoagiemeal-dark-green
    tint1: '#f0fdf4', // Tailwind green-50
    tint2: '#f0fdf4', // Tailwind green-50
    border: {
      default: '#EEEEEE',
      muted: '#F1F1F1',
    },
    icon: {
      default: '#808080',
      muted: '#D2D2D2',
      disabled: '#D2D2D2',
      selected: '#008001', // hoagiemeal-dark-green
    },
    text: {
      danger: '#D14343',
      success: '#008001', // hoagiemeal-dark-green
      info: '#008001', // hoagiemeal-dark-green
    },
  },
  intents: {
    ...hoagieUI.intents,
    info: {
      background: '#f0fdf4', // Tailwind green-50
      border: '#008001', // hoagiemeal-dark-green
      text: '#15803d', // Tailwind green-700
      icon: '#008001', // hoagiemeal-dark-green
    },
    success: {
      background: '#f0fdf4', // Tailwind green-50
      border: '#008001', // hoagiemeal-dark-green
      text: '#166534', // Tailwind green-800
      icon: '#008001', // hoagiemeal-dark-green
    },
    warning: {
      background: '#FFFAF2',
      border: '#FFB020',
      text: '#996A13',
      icon: '#FFB020',
    },
    danger: {
      background: '#FDF4F4',
      border: '#D14343',
      text: '#A73636',
      icon: '#D14343',
    },
  },
  shadows: {
    ...hoagieUI.shadows,
    focusRing: '0 0 0 2px #DCF2EA', // green100
  },
});
