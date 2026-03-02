export const Colors = {
  // Brand greens (mirrored from frontend)
  primary: '#008001',
  primaryDark: '#166534',
  primaryMid: '#15803d',
  primaryLight: '#bbf7d0',
  primaryXLight: '#f0fdf4',

  // Meal backgrounds
  breakfast: '#ebf7f2',
  lunch: '#daefe8',
  dinner: '#cae6dc',

  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',

  // Semantic
  error: '#ef4444',
  border: '#e5e7eb',
  background: '#f9fafb',
  card: '#ffffff',
  text: '#111827',
  textMuted: '#6b7280',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;
