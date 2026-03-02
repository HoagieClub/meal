'use client';

import { SectionTitle } from './section-title';
import { MetricValue } from './metric-value';

export interface ServingCaloriesProps {
  servingSize: number | null | undefined;
  servingUnit: string | null | undefined;
  calories: number | null | undefined;
}

// Remove trailing zeroes from numbers
function formatAmount(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return 'N/A';
  return parseFloat(n.toFixed(10)).toString();
}

export function ServingCalories({ servingSize, servingUnit, calories }: ServingCaloriesProps) {
  const servingDisplay =
    servingSize != null
      ? `${formatAmount(servingSize)}${servingUnit ? ` ${servingUnit}` : ''}`
      : '-';

  const caloriesDisplay = calories != null ? formatAmount(calories) : '-';

  return (
    <div className='flex flex-row justify-between items-center p-3 pb-[9px] pt-[7px] -ml-[9px] -mt-2 rounded-[5px] bg-gradient-to-b from-white to-[#E9E9E9]'>
      <div className='flex flex-col gap-1 shrink-0'>
        <SectionTitle>Serving Size</SectionTitle>
        <MetricValue>{servingDisplay}</MetricValue>
      </div>
      <div className='w-[1.5px] bg-[#b6b6b6] self-stretch rounded-full mx-2'></div>
      <div className='flex flex-col gap-1 shrink-0'>
        <SectionTitle>Calories</SectionTitle>
        <MetricValue className='text-right'>{caloriesDisplay}</MetricValue>
      </div>
    </div>
  );
}
