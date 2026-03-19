'use client';

import { SectionTitle } from './section-title';

export interface AllergensProps {
  allergens: string;
}

export function Allergens({ allergens }: AllergensProps) {
  if (!allergens) {
    return null;
  }

  return (
    <div className='flex flex-col gap-1'>
      <SectionTitle>Allergens</SectionTitle>
      <p className='text-[10px] text-[#6b6b6b] leading-tight font-light'>{allergens}</p>
    </div>
  );
}
