'use client';

import { SectionTitle } from './section-title';

export interface IngredientsProps {
  ingredients: string;
}

export function Ingredients({ ingredients }: IngredientsProps) {
  if (!ingredients) {
    return null;
  }

  return (
    <div className='flex flex-col gap-1'>
      <SectionTitle>Ingredients</SectionTitle>
      <p className='text-[10px] text-[#6b6b6b] leading-tight font-light'>{ingredients}</p>
    </div>
  );
}
