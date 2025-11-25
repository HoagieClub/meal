import { AllergenKey, DietKey } from '@/types/dining';
import { MealType } from '@/types/goals';
import cjlIcon from '@/public/images/icons/cjl.png';
import defaultIcon from '@/public/images/icons/default.png';
import forbesIcon from '@/public/images/icons/forbes.png';
import gradIcon from '@/public/images/icons/grad.png';
import whitmanIcon from '@/public/images/icons/whitman.png';
import yehIcon from '@/public/images/icons/yeh.png';
import rockyIcon from '@/public/images/icons/rocky.png';
import { Theme } from 'evergreen-ui';

const MEAL_RANGES: Record<MealType, string> = {
  Breakfast: '7:30 AM – 10:30 AM',
  Lunch: '11:30 AM – 2:00 PM',
  Dinner: '5:00 PM – 8:00 PM',
};

const ALLERGEN_EMOJI: Record<string, string> = {
  peanut: '🥜',
  coconut: '🌰',
  eggs: '🥚',
  milk: '🥛',
  wheat: '🌾',
  soybeans: '🌱',
  crustacean: '🦞',
  alcohol: '🍺',
  gluten: '🍞',
  fish: '🐟',
  sesame: '🍔',
};

const initialSelectedHalls = [
  'Forbes College',
  'Mathey College',
  'Rockefeller College',
  'Whitman & Butler Colleges',
  'Yeh College & NCW',
  'Center for Jewish Life',
  'Graduate College',
];

const ALLERGENS: AllergenKey[] = [
  'Peanut',
  'Coconut',
  'Eggs',
  'Milk',
  'Wheat',
  'Soybeans',
  'Crustacean',
  'Alcohol',
  'Gluten',
  'Fish',
  'Sesame',
];

const ALLERGEN_STYLE_MAP = (theme: any): Record<AllergenKey, any> => ({
  Peanut: {
    bg: theme.colors.yellow100,
    color: theme.colors.yellow900,
  },
  Coconut: {
    bg: theme.colors.orange100,
    color: theme.colors.orange900,
  },
  Eggs: {
    bg: theme.colors.yellow100,
    color: theme.colors.yellow900,
  },
  Milk: {
    bg: theme.colors.blue100,
    color: theme.colors.blue900,
  },
  Wheat: {
    bg: theme.colors.yellow100,
    color: theme.colors.yellow900,
  },
  Soybeans: {
    bg: theme.colors.green100,
    color: theme.colors.green900,
  },
  Crustacean: { bg: theme.colors.red100, color: theme.colors.red900 },
  Alcohol: {
    bg: theme.colors.purple100,
    color: theme.colors.purple900,
  },
  Gluten: {
    bg: theme.colors.orange100,
    color: theme.colors.orange900,
  },
  Fish: { bg: theme.colors.blue100, color: theme.colors.blue900 },
  Sesame: {
    bg: theme.colors.orange100,
    color: theme.colors.orange900,
  },
});

const HALL_ICON_MAP: Record<string, string> = {
  'Center for Jewish Life': cjlIcon.src,
  'Forbes College': forbesIcon.src,
  'Graduate College': gradIcon.src,
  'Whitman & Butler Colleges': whitmanIcon.src,
  'Yeh College & NCW': yehIcon.src,
  'Rockefeller College': rockyIcon.src,
  'Mathey College': defaultIcon.src,
  'Frist Grill': defaultIcon.src,
};

const DIET_STYLE_MAP = (theme: Theme): Record<DietKey, any> => ({
  Vegetarian: {
    bg: theme.colors.green100,
    color: theme.colors.green900,
  },
  Vegan: { bg: theme.colors.green50, color: theme.colors.green800 },
  Halal: { bg: theme.colors.blue100, color: theme.colors.blue900 },
  Kosher: {
    bg: theme.colors.purple100,
    color: theme.colors.purple900,
  },
});

const HALL_EMOJI_STYLE = (theme: any) => ({
  bg: theme.colors.gray100,
  color: theme.colors.gray700,
});

const DIET_LABEL_MAP: Record<DietKey, string> = {
  Vegetarian: 'V',
  Vegan: 'VG',
  Halal: 'H',
  Kosher: 'K',
};

export {
  MEAL_RANGES,
  ALLERGEN_EMOJI,
  initialSelectedHalls,
  ALLERGENS,
  ALLERGEN_STYLE_MAP,
  HALL_ICON_MAP,
  DIET_STYLE_MAP,
  HALL_EMOJI_STYLE,
  DIET_LABEL_MAP,
};
