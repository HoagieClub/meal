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
    green900: '#10261E',
    green800: '#214C3C',
    green700: '#317159',
    green600: '#429777',
    green500: '#52BD95',
    green400: '#75CAAA',
    green300: '#97D7BF',
    green200: '#BAE5D5',
    green100: '#DCF2EA',
    green50: '#EBF0FF',
    green25: '#F5FBF8',
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
    selected: '#52BD95',
    tint1: '#F5FBF8',
    tint2: '#F5FBF8',
    overlay: 'rgba(16, 38, 30, 0.7)',
    yellowTint: '#FFEFD2',
    greenTint: '#F5FBF8',
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
      selected: '#52BD95', // green500
    },
    text: {
      danger: '#D14343',
      success: '#52BD95',
      info: '#52BD95', // green500
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
      color: '#429777', // green600
      backgroundColor: '#DCF2EA', // green100
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
      background: '#F5FBF8', // greenTint
      border: '#52BD95', // green500
      text: '#429777', // green600
      icon: '#52BD95', // green500
    },
    success: {
      background: '#F5FBF8', // greenTint
      border: '#52BD95', // green500
      text: '#317159', // green700
      icon: '#52BD95', // green500
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
    focusRing: '0 0 0 2px #DCF2EA', // green100
  },
  fontFamilies: {
    ...defaultTheme.fontFamilies,
    display:
      '"Inter", "SF UI Display", -apple-system, BlinkMacSystemFont, "Segoe UI",Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    ui: '"Inter", "SF UI Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
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
    selected: '#52BD95', // green500
    tint1: '#F5FBF8', // greenTint
    tint2: '#F5FBF8', // greenTint
    border: {
      default: '#EEEEEE',
      muted: '#F1F1F1',
    },
    icon: {
      default: '#808080',
      muted: '#D2D2D2',
      disabled: '#D2D2D2',
      selected: '#52BD95', // green500
    },
    text: {
      danger: '#D14343',
      success: '#52BD95',
      info: '#52BD95', // green500
    },
  },
  intents: {
    ...hoagieUI.intents,
    info: {
      background: '#F5FBF8', // greenTint
      border: '#52BD95', // green500
      text: '#429777', // green600
      icon: '#52BD95', // green500
    },
    success: {
      background: '#F5FBF8', // greenTint
      border: '#52BD95', // green500
      text: '#317159', // green700
      icon: '#52BD95', // green500
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
