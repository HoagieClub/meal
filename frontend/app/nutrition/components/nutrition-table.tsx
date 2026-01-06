/**
 * @overview Nutrition table component.
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

import { majorScale, minorScale, Pane, Text } from 'evergreen-ui';
import { Separator } from '@/components/ui/separator';
import { MacronutrientRow, MicronutrientRow } from './nutrient-rows';
import { MenuItemNutrition } from '@/types/dining';
import { MACRONUTRIENTS, MICRONUTRIENTS } from '../actions';

/**
 * Nutrition table component.
 *
 * @param nutrition - The nutrition to display.
 * @returns The nutrition table component.
 */
export default function NutritionTable({ nutrition }: { nutrition: MenuItemNutrition | null }) {
  if (!nutrition) return null;
  // Get the macronutrients and micronutrients for the nutrition
  const macronutrients = MACRONUTRIENTS(nutrition);
  const micronutrients = MICRONUTRIENTS(nutrition);

  // Render the nutrition table
  return (
    <Pane className='col-span-2'>
      <Pane display='grid' gridTemplateColumns='2fr 1fr 1fr' fontWeight={600}>
        <Text fontWeight={500} fontSize={15} color='green800'>
          Macronutrients
        </Text>
        <Text textAlign='right'>Amount</Text>
        <Text textAlign='right'>Est. %DV</Text>
      </Pane>
      <Separator height='3px' />

      {/* Render the macronutrients if they exist */}
      <Pane
        marginTop={minorScale(1)}
        paddingTop={minorScale(1)}
        display='grid'
        rowGap={minorScale(2)}
      >
        {/* Map over and render every macronutrient in its own row */}
        {macronutrients &&
          macronutrients.length > 0 &&
          macronutrients.map((nutrient) => (
            <MacronutrientRow
              key={nutrient.label}
              label={nutrient.label}
              amount={nutrient.amount}
              unit={nutrient.unit}
              dvPercent={nutrient.dvPercent}
            />
          ))}
      </Pane>

      <Pane display='grid' gridTemplateColumns='2fr 1fr' fontWeight={600} marginTop={majorScale(3)}>
        <Text fontWeight={500} fontSize={15} color='green800'>
          Micronutrients
        </Text>
        <Text textAlign='right'>% Daily Value</Text>
      </Pane>
      <Separator height='3px' />

      {/* Render the micronutrients if they exist */}
      <Pane
        marginTop={minorScale(1)}
        paddingTop={minorScale(1)}
        display='grid'
        rowGap={minorScale(2)}
      >
        {/* Map over and render every micronutrient in its own row */}
        {micronutrients &&
          micronutrients.length > 0 &&
          micronutrients.map((nutrient) => (
            <MicronutrientRow
              key={nutrient.label}
              label={nutrient.label}
              dvPercent={nutrient.dvPercent}
            />
          ))}
      </Pane>
    </Pane>
  );
}
