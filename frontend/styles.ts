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
import gradIcon from '@/public/images/icons/grad.png';
import forbesBanner from '@/public/images/banners/forbesbanner.png';
import matheyBanner from '@/public/images/banners/rockybanner.png';
import whitmanBanner from '@/public/images/banners/whitmanbutlerbanner.png';
import yehBanner from '@/public/images/banners/yehbanner.png';
import gradBanner from '@/public/images/banners/gradbanner.png';
import chemistryIcon from '@/public/images/icons/chemistry.png';
import equadIcon from '@/public/images/icons/equad.png';
import fristIcon from '@/public/images/icons/frist.png';
import genomicsIcon from '@/public/images/icons/genomics.png';
import shultzIcon from '@/public/images/icons/shultz.png';
import chemistryBanner from '@/public/images/banners/Chemistry-CaFe.png';
import equadBanner from '@/public/images/banners/EQuad-Cafe.png';
import fristBanner from '@/public/images/banners/Frist-Pic.png';
import genomicsBanner from '@/public/images/banners/Genomics-Cafe.png';
import shultzBanner from '@/public/images/banners/Shultz-Cafe.png';
import { Meal, DiningHall } from '@/types/types';
import { Theme } from 'evergreen-ui';
import { StaticImageData } from 'next/image';

// Hall emoji style that maps from dining hall type to their corresponding emoji style.
export const HALL_EMOJI_STYLE = (theme: Theme) => ({
  bg: theme.colors.gray100,
  color: theme.colors.gray700,
});

// Hall icon map that maps from dining hall type to their corresponding icon image.
export const HALL_ICON_MAP: Record<DiningHall, string> = {
  'Center for Jewish Life': cjlIcon.src,
  'Forbes College': forbesIcon.src,
  'Whitman & Butler Colleges': whitmanButlerIcon.src,
  'Yeh College & NCW': yehIcon.src,
  'Mathey & Rockefeller Colleges': rockyIcon.src,
  'Graduate College': gradIcon.src,
  'Chemistry CaFe': chemistryIcon.src,
  'EQuad Cafe': equadIcon.src,
  'Frist Gallery': fristIcon.src,
  'Genomics Cafe': genomicsIcon.src,
  'Shultz Cafe': shultzIcon.src,
};

// Hall banner map that maps from dining hall type to their corresponding banner image.
export const HALL_BANNER_MAP: Record<DiningHall, StaticImageData> = {
  'Forbes College': forbesBanner,
  'Mathey & Rockefeller Colleges': matheyBanner,
  'Whitman & Butler Colleges': whitmanBanner,
  'Yeh College & NCW': yehBanner,
  'Center for Jewish Life': cjlBanner,
  'Graduate College': gradBanner,
  'Chemistry CaFe': chemistryBanner,
  'EQuad Cafe': equadBanner,
  'Frist Gallery': fristBanner,
  'Genomics Cafe': genomicsBanner,
  'Shultz Cafe': shultzBanner,
};

// Meal color map that maps from meal type to their corresponding color.
export const MEAL_COLOR_MAP = (theme: Theme): Record<Meal, string> => ({
  Breakfast: "#ebf7f2",
  Lunch: "#daefe8",
  Dinner: "#cae6dc",
});
