/**
 * @overview Allergen sidebar component for menu page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import React from 'react';
import { Pane, Heading, Text, majorScale, minorScale, useTheme } from 'evergreen-ui';
import { ALLERGENS } from '@/data';
import { ALLERGEN_EMOJI } from '@/styles';
import { Allergen } from '@/types/dining';

/**
 * Props for the AllergenSidebar component.
 *
 * @param allergens - The allergens to display
 * @param toggleAllergen - The function to call when an allergen is toggled
 */
interface AllergenSidebarProps {
  allergens: Allergen[];
  toggleAllergen: (allergen: Allergen) => void;
}

/**
 * Allergen sidebar component for filtering by allergens.
 *
 * @returns The allergen sidebar component
 */
export default function AllergenSidebar({
  allergens: selectedAllergens,
  toggleAllergen,
}: AllergenSidebarProps) {
  const theme = useTheme();

  return (
    <Pane
      className='hidden sm:flex'
      flexDirection='column'
      width={200}
      padding={majorScale(3)}
      overflowY='auto'
      zIndex={2}
    >
      <Heading size={600} color={theme.colors.green900}>
        Allergens to Avoid
      </Heading>
      <Pane marginTop={majorScale(2)} display='flex' flexDirection='column' gap={majorScale(2)}>
        {ALLERGENS.map((allergen: Allergen) => {
          const isSelected = selectedAllergens.includes(allergen);
          const emojiForAllergen = ALLERGEN_EMOJI[allergen as Allergen];
          const backgroundColor = isSelected ? theme.colors.red100 : theme.colors.gray100;
          const title = isSelected
            ? `Hiding items containing ${allergen}`
            : `Click to hide items containing ${allergen}`;
          const onChange = () => {
            toggleAllergen(allergen);
          };

          return (
            <Pane
              key={allergen}
              display='flex'
              alignItems='center'
              cursor='pointer'
              opacity={isSelected ? 1.0 : 0.6}
              onClick={onChange}
              title={title}
            >
              <Pane
                width={28}
                height={28}
                display='inline-flex'
                alignItems='center'
                justifyContent='center'
                borderRadius={14}
                background={backgroundColor}
                marginRight={minorScale(1)}
              >
                <Text size={200}>{emojiForAllergen}</Text>
              </Pane>
              <Text size={400} color={theme.colors.green900} fontWeight={isSelected ? 600 : 400}>
                {allergen}
              </Text>
            </Pane>
          );
        })}
      </Pane>
    </Pane>
  );
}
