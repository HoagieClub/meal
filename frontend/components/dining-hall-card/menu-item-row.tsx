'use client';

import React from 'react';
import { Pane, minorScale, majorScale } from 'evergreen-ui';
import { ALLERGEN_ICON_MAP } from '@/data';
import { Allergen } from '@/types/types';
import { LikeDislikeButtons } from '@/components/dining-hall-card/like-dislike-button';
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useNutritionAccordion } from '@/contexts/nutrition-accordion-context';
import NutritionAccordionContent from '../nutrition/nutrition-accordion-content';

/**
 * Menu item row component.
 *
 * @param item - The menu item to display.
 * @param diningHallId - The dining hall id.
 * @param sortOption - The sort option.
 * @returns The menu item row component
 */
export default function MenuItemRow({
  item,
  diningHallId,
  sortOption,
}: {
  item: any;
  diningHallId: string;
  sortOption: string;
}) {
  const { expandedItemId, setExpandedItemId } = useNutritionAccordion();
  const menuItemId = item?.id;
  if (!menuItemId) {
    console.warn('MenuItemRow: item missing id', item);
  }

  const itemValue = `${diningHallId}-${menuItemId || 'unknown'}`;
  const isExpanded = expandedItemId === itemValue;
  const searchText =
    `${item?.allergens || ''} ${item?.nutrition?.allergens || ''} ${item?.ingredients || ''} ${item?.nutrition?.ingredients || ''}`.toLowerCase();
  const foundAllergens = (Object.keys(ALLERGEN_ICON_MAP) as Allergen[]).filter((allergen) =>
    searchText.includes(allergen.toLowerCase())
  );

  return (
    <Accordion
      type='single'
      collapsible
      value={isExpanded ? itemValue : ''}
      onValueChange={(value) => setExpandedItemId(value || '')}
      className='border-none'
    >
      <AccordionItem value={itemValue} className='border-none'>
        <Pane
          display='grid'
          gridTemplateColumns='auto auto'
          rowGap={minorScale(1)}
          columnGap={minorScale(0)}
          cursor='pointer'
        >
          <Pane
            marginY={sortOption === 'Category' ? minorScale(1) : majorScale(1)}
            style={{ fontSize: 14, fontWeight: 400, color: 'black', lineHeight: 1.2 }}
          >
            <span style={{ paddingRight: minorScale(1) }}>{item.name}</span>{' '}
            {foundAllergens.map((allergen: Allergen) => (
              <img
                key={allergen}
                src={ALLERGEN_ICON_MAP[allergen]}
                alt={allergen}
                title={allergen}
                width={14}
                height={14}
                style={{ display: 'inline', marginRight: minorScale(1), verticalAlign: 'middle' }}
              />
            ))}
          </Pane>
          <Pane
            display='flex'
            flexDirection='row'
            alignItems='center'
            justifyContent='flex-end'
            gap={minorScale(1)}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <LikeDislikeButtons item={item} />
            <AccordionTrigger className='p-0 hover:no-underline [&>svg]:h-4 [&>svg]:w-4 cursor-pointer' />
          </Pane>
        </Pane>
        <AccordionContent>
          <NutritionAccordionContent item={item} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
