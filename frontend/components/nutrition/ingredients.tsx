/**
 * @overview Ingredient list display for menu items.
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

'use client';

import { SectionTitle } from './section-title';

export interface IngredientsProps {
  ingredients: string;
  label?: string;
}

export function Ingredients({ ingredients, label = 'Ingredients' }: IngredientsProps) {
  if (!ingredients) {
    return null;
  }

  return (
    <div className='flex flex-col gap-1'>
      <SectionTitle>{label}</SectionTitle>
      <p className='text-[10px] text-[#6b6b6b] leading-tight font-light'>{ingredients}</p>
    </div>
  );
}
