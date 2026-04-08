/**
 * @overview Component for displaying individual nutrient information with daily value percentage.
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
import { MetricValue } from './metric-value';

export interface NutrientCellProps {
  label: string;
  amount: number | null | undefined;
  unit: string;
  rdvPercent: number | null | undefined;
  className?: string;
}

type NutrientType = 'limit' | 'good' | 'neutral';

const NUTRIENT_TYPES: Record<string, NutrientType> = {
  Sodium: 'limit',
  'Total Fat': 'limit',
  'Saturated Fat': 'limit',
  'Trans Fat': 'limit',
  Sugars: 'limit',
  Cholesterol: 'limit',
  Protein: 'good',
  'Dietary Fiber': 'good',
  'Vitamin D': 'good',
  Calcium: 'good',
  Iron: 'good',
  Potassium: 'good',
  'Total Carbs': 'neutral',
};

function getRdvColor(label: string, percent: number): string {
  const type = NUTRIENT_TYPES[label] ?? 'neutral';

  if (type === 'limit') {
    if (percent < 15) return '#8BCF95'; // green
    if (percent <= 40) return '#F6C77D'; // yellow
    return '#FF8989'; // red
  }

  if (type === 'good') {
    return '#8BCF95'; // green
  }

  return '#C9C9C9E5'; // neutral gray
}

// Remove trailing zeroes from numbers
function formatAmount(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '-';
  return parseFloat(n.toFixed(10)).toString();
}

export function NutrientCell({ label, amount, unit, rdvPercent, className }: NutrientCellProps) {
  return (
    <div className={`flex flex-col gap-[2px] ${className ?? ''}`}>
      <SectionTitle>{label}</SectionTitle>
      <div className='flex flex-col items-baseline gap-2'>
        <MetricValue>{amount != null ? `${formatAmount(amount)} ${unit}` : '-'}</MetricValue>
        {rdvPercent != null && (
          <div className='text-[8px] text-[#6A6868] leading-1'>
            <span>{formatAmount(rdvPercent)}%</span>
            <span
              className='inline-block w-[15px] h-[2px] mx-1 align-middle rounded'
              style={{ backgroundColor: getRdvColor(label, rdvPercent) }}
            />
            <span>RDV</span>
          </div>
        )}
      </div>
    </div>
  );
}
