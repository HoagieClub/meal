/**
 * @overview Menu item row component.
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
import { Pane, minorScale, majorScale } from 'evergreen-ui';
import { ALLERGEN_ICON_MAP } from '@/data';
import { Allergen } from '@/types/types';
import { MiniLikeDislikeButtons } from '@/components/mini-like-dislike-button';
import { MiniFavoriteButton } from '@/components/mini-favorite-button';
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { useNutritionAccordion } from '@/contexts/nutrition-accordion-context';
import NutritionAccordionContent from './nutrition-accordion-content';

/**
 * Menu item row component.
 *
 * @param item - The menu item to display.
 * @returns The menu item row component
 */
export default function MenuItemRow({
  item,
  diningHallId,
}: {
  item: any;
  diningHallId: string;
}) {
  const { expandedItemId, setExpandedItemId } = useNutritionAccordion();
  const menuItemApiId = item?.apiId;

  const handleRowClick = () => {
    const itemValue = `${diningHallId}-${menuItemApiId}`;
    setExpandedItemId(expandedItemId === itemValue ? '' : itemValue);
  };

  return (
    <Accordion
      type="single"
      collapsible
      value={expandedItemId}
      onValueChange={setExpandedItemId}
      className="border-none"
    >
      <AccordionItem value={`${diningHallId}-${menuItemApiId}`} className="border-none">
        <Pane
          display='grid'
          gridTemplateColumns='2fr 1fr auto 1fr'
          rowGap={minorScale(1)}
          columnGap={minorScale(2)}
          onClick={handleRowClick}
          cursor="pointer"
        >
          <Pane marginY={majorScale(1)} style={{ fontSize: 14, fontWeight: 500, color: 'black', lineHeight: 1.2 }}>
            {/* Display the menu item name and dietary/allergen icons. */}
            <span style={{ paddingRight: minorScale(1) }}>{item.name}</span>{' '}
            {item.allergens && item.allergens.map((allergen: Allergen) => (
              <img key={allergen} src={ALLERGEN_ICON_MAP[allergen]} alt={allergen} title={allergen} width={14} height={14} style={{ display: 'inline', marginRight: minorScale(1), verticalAlign: 'middle' }} />
            ))}
          </Pane>

          {/* Display the favorite and like/dislike buttons. */}
          <Pane
            display='flex'
            flexDirection='row'
            alignItems='center'
            justifyContent='flex-end'
            gap={minorScale(1)}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MiniFavoriteButton item={item} />
            <MiniLikeDislikeButtons item={item} />
          </Pane>
          <AccordionTrigger className="p-0 hover:no-underline [&>svg]:h-4 [&>svg]:w-4 cursor-pointer" />
        </Pane>

        {/* Accordion content with nutrition info */}
        <AccordionContent >
          <NutritionAccordionContent item={item} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
