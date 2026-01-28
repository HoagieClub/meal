/**
 * @overview Nutrient rows component.
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

import { Pane, Text } from 'evergreen-ui';
import { Separator } from '@/components/ui/separator';

/**
 * Macronutrient row component.
 *
 * @param label - The label of the nutrient.
 * @param amount - The amount of the nutrient.
 * @param unit - The unit of the nutrient.
 * @param dvPercent - The dv percent of the nutrient.
 * @returns The macronutrient row component.
 */
export const MacronutrientRow = ({
  label,
  amount,
  unit,
  dvPercent,
}: {
  label: string;
  amount: number | string | null;
  unit: string;
  dvPercent: number | null;
}) => {
  if (amount === null || amount === undefined) return null;

  // Determine the color of the dv percent based on the dv percent
  let color = 'green';
  if (dvPercent !== null) {
    if (dvPercent >= 20) {
      color = 'red';
    } else if (dvPercent >= 10) {
      color = 'orange';
    }
  }

  // Render the macronutrient row
  return (
    <>
      <Pane display='grid' gridTemplateColumns='2fr 1fr 1fr' alignItems='center'>
        <Text fontWeight={500}>{label}</Text>
        <Text textAlign='right'>
          {amount ?? '—'}
          {unit}
        </Text>
        {dvPercent === null ? (
          <Text textAlign='right'>—</Text>
        ) : (
          <Text textAlign='right' fontWeight={600} color={color}>
            {dvPercent}%
          </Text>
        )}
      </Pane>
      <Separator height='1px' marginTop={0} />
    </>
  );
};

/**
 * Micronutrient row component.
 *
 * @param label - The label of the nutrient.
 * @param dvPercent - The dv percent of the nutrient.
 * @returns The micronutrient row component.
 */
export const MicronutrientRow = ({
  label,
  dvPercent,
}: {
  label: string;
  dvPercent?: string | null;
}) => {
  if (dvPercent === null) return null;
  return (
    <>
      <Pane display='grid' gridTemplateColumns='2fr 1fr' alignItems='center'>
        <Text fontWeight={500}>{label}</Text>
        <Text textAlign='right' color='green700' fontWeight={600}>
          {dvPercent}%
        </Text>
      </Pane>
      <Separator height='1px' marginTop={0} />
    </>
  );
};
