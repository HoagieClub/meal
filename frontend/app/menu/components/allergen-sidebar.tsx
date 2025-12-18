/**
 * @overview Allergen sidebar component.
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
import { AllergenType } from '@/data';
import { ALLERGENS } from '@/data';
import { ALLERGEN_EMOJI } from '@/styles';

/**
 * Allergen row component.
 *
 * @param allergen - The allergen to display.
 * @param selected - The selected allergens.
 * @param setAppliedAllergens - The function to set the applied allergens.
 * @returns The allergen row component.
 */
const AllergenRow = ({
  allergen,
  selected,
  setAppliedAllergens,
}: {
  allergen: AllergenType;
  selected: string[];
  setAppliedAllergens: any;
}) => {
  const theme = useTheme();
  const ICON_SIZE = 28;
  const isSelected = selected.includes(allergen);
  const emojiForAllergen = ALLERGEN_EMOJI[allergen as AllergenType];
  const backgroundColor = isSelected ? theme.colors.red100 : theme.colors.gray100;
  const title = isSelected
    ? `Hiding items containing ${allergen}`
    : `Click to hide items containing ${allergen}`;

  const handleClick = () => {
    setAppliedAllergens((prev: AllergenType[]) =>
      prev.includes(allergen as AllergenType)
        ? prev.filter((a: AllergenType) => a !== allergen)
        : [...prev, allergen]
    );
  };

  return (
    <Pane
      key={allergen}
      display='flex'
      alignItems='center'
      cursor='pointer'
      opacity={isSelected ? 1.0 : 0.6}
      onClick={handleClick}
      title={title}
    >
      <Pane
        width={ICON_SIZE}
        height={ICON_SIZE}
        display='inline-flex'
        alignItems='center'
        justifyContent='center'
        borderRadius={ICON_SIZE / 2}
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
};

/**
 * Allergen sidebar component.
 *
 * @param selected - The selected allergens.
 * @param setAppliedAllergens - The function to set the applied allergens.
 * @returns The allergen sidebar component.
 */
export default function AllergenSidebar({
  selected,
  setAppliedAllergens,
}: {
  selected: string[];
  setAppliedAllergens: any;
}) {
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
        {ALLERGENS.map((allergen: AllergenType) => (
          <AllergenRow
            key={allergen}
            allergen={allergen}
            selected={selected}
            setAppliedAllergens={setAppliedAllergens}
          />
        ))}
      </Pane>
    </Pane>
  );
}
