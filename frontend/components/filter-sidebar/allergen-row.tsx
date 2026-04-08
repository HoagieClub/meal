/**
 * @overview Checkbox row component for filtering menu items by allergen.
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

import React from 'react';
import { Pane, Text, minorScale, Checkbox, useTheme } from 'evergreen-ui';
import { ALLERGEN_ICON_MAP } from '@/data';
import { Allergen } from '@/types/types';

export interface AllergenRowProps {
  allergen: Allergen;
  checked: boolean;
  onChange: () => void;
}

export default function AllergenRow({ allergen, checked, onChange }: AllergenRowProps) {
  const theme = useTheme();

  return (
    <Pane display='flex' alignItems='center' height={30} cursor='pointer' onClick={onChange}>
      <Checkbox
        checked={checked}
        onChange={onChange}
        className='[&_input:checked+div]:!bg-green-700'
      />
      <Pane marginLeft={minorScale(2)} marginRight={minorScale(1)}>
        <img src={ALLERGEN_ICON_MAP[allergen]} alt={allergen} width={15} height={15} />
      </Pane>
      <Text size={300} color={theme.colors.gray900}>
        {allergen}
      </Text>
    </Pane>
  );
}
