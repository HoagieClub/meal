import cjlIcon from '@/public/images/icons/cjl.png';
import defaultIcon from '@/public/images/icons/default.png';
import forbesIcon from '@/public/images/icons/forbes.png';
import gradIcon from '@/public/images/icons/grad.png';
import whitmanIcon from '@/public/images/icons/whitman.png';
import yehIcon from '@/public/images/icons/yeh.png';
import rockyIcon from '@/public/images/icons/rocky.png';
import cjlBanner from '@/public/images/banners/cjl-banner.png';
import forbesBanner from '@/public/images/banners/forbesbanner.png';
import gradBanner from '@/public/images/banners/gradbanner.png';
import matheyBanner from '@/public/images/banners/rockybanner.png';
import rockyBanner from '@/public/images/banners/rockybanner.png';
import whitmanBanner from '@/public/images/banners/whitmanbanner.png';
import yehBanner from '@/public/images/banners/yehbanner.png';
import { Meal, Allergen, DietaryTag, DiningHall } from '@/types/dining';
import { Theme } from 'evergreen-ui';
import { StaticImageData } from 'next/image';

export const HALL_EMOJI_STYLE = (theme: Theme) => ({
  bg: theme.colors.gray100,
  color: theme.colors.gray700,
});

export const ALLERGEN_STYLE_MAP = (theme: Theme): Record<Allergen, any> => ({
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

export const HALL_ICON_MAP: Record<DiningHall, string> = {
  'Center for Jewish Life': cjlIcon.src,
  'Forbes College': forbesIcon.src,
  'Graduate College': gradIcon.src,
  'Whitman & Butler Colleges': whitmanIcon.src,
  'Yeh College & NCW': yehIcon.src,
  'Mathey & Rockefeller Colleges': rockyIcon.src,
  'Frist Grill': defaultIcon.src,
};

// @ts-ignore
export const HALL_BANNER_MAP: Record<DiningHall, StaticImageData> = {
  'Forbes College': forbesBanner,
  'Mathey & Rockefeller Colleges': matheyBanner,
  'Whitman & Butler Colleges': whitmanBanner,
  'Yeh College & NCW': yehBanner,
  'Center for Jewish Life': cjlBanner,
  'Graduate College': gradBanner,
};

export const DIET_LABEL_MAP: Record<DietaryTag, string> = {
  Vegetarian: 'V',
  Vegan: 'VG',
  Halal: 'H',
  Kosher: 'K',
};

export const MEAL_COLOR_MAP = (theme: Theme): Record<Meal, string> => ({
  Breakfast: theme.colors.green100 as string,
  Lunch: theme.colors.green200 as string,
  Dinner: theme.colors.green300 as string,
});

export const DIET_STYLE_MAP = (theme: Theme): Record<DietaryTag, any> => ({
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

export const ALLERGEN_EMOJI: Record<Allergen, string> = {
  Peanut: '🥜',
  Coconut: '🌰',
  Eggs: '🥚',
  Milk: '🥛',
  Wheat: '🌾',
  Soybeans: '🌱',
  Crustacean: '🦞',
  Alcohol: '🍺',
  Gluten: '🍞',
  Fish: '🐟',
  Sesame: '🍔',
};
