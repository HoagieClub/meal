/**
 * @overview Style constants for the Hoagie Meal app.
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

import cjlIcon from '@/public/images/icons/cjl.png';
import forbesIcon from '@/public/images/icons/forbes.png';
import whitmanIcon from '@/public/images/icons/whitman.png';
import whitmanButlerIcon from '@/public/images/icons/whitman-butler.png';
import yehIcon from '@/public/images/icons/yeh.png';
import rockyIcon from '@/public/images/icons/rocky.png';
import cjlBanner from '@/public/images/banners/cjl-banner.png';
import forbesBanner from '@/public/images/banners/forbesbanner.png';
import matheyBanner from '@/public/images/banners/rockybanner.png';
import whitmanBanner from '@/public/images/banners/whitmanbutlerbanner.png';
import yehBanner from '@/public/images/banners/yehbanner.png';
import { Meal, Allergen, DietaryTag, DiningHall } from '@/types/types';
import { Theme } from 'evergreen-ui';
import { StaticImageData } from 'next/image';

// Hall emoji style that maps from dining hall type to their corresponding emoji style.
export const HALL_EMOJI_STYLE = (theme: Theme) => ({
  bg: theme.colors.gray100,
  color: theme.colors.gray700,
});

// Allergen style map that maps from allergen type to their corresponding style.
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
  Fish: { bg: theme.colors.blue100, color: theme.colors.blue900 },
  Sesame: {
    bg: theme.colors.orange100,
    color: theme.colors.orange900,
  },
});

// Hall icon map that maps from dining hall type to their corresponding icon image.
export const HALL_ICON_MAP: Record<DiningHall, string> = {
  'Center for Jewish Life': cjlIcon.src,
  'Forbes College': forbesIcon.src,
  'Whitman & Butler Colleges': whitmanButlerIcon.src,
  'Yeh College & NCW': yehIcon.src,
  'Mathey & Rockefeller Colleges': rockyIcon.src,
};

// Hall banner map that maps from dining hall type to their corresponding banner image.
export const HALL_BANNER_MAP: Record<DiningHall, StaticImageData> = {
  'Forbes College': forbesBanner,
  'Mathey & Rockefeller Colleges': matheyBanner,
  'Whitman & Butler Colleges': whitmanBanner,
  'Yeh College & NCW': yehBanner,
  'Center for Jewish Life': cjlBanner,
};

// Meal color map that maps from meal type to their corresponding color.
export const MEAL_COLOR_MAP = (theme: Theme): Record<Meal, string> => ({
  Breakfast: theme.colors.green100 as string,
  Lunch: theme.colors.green200 as string,
  Dinner: theme.colors.green300 as string,
});

// Diet style map that maps from dietary tag type to their corresponding style.
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
  'Gluten Free': {
    bg: theme.colors.orange100,
    color: theme.colors.orange900,
  },
});

