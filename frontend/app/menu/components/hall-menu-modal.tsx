/**
 * @overview Hall menu modal component.
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

import { Dialog, Pane, majorScale, minorScale } from 'evergreen-ui';
import React, { useState, useEffect } from 'react';
import MenuSection from './menu-selection';
import { Separator } from '@/components/ui/separator';
import SortDropdown from './sort-dropdown';
import { useMediaQuery } from '@/hooks/use-media-query';
import ColumnVisibilityDropdown from './column-visibility-dropdown';
import { Column, COLUMNS, MenuSortOption } from '@/types/types';

/**
 * Hall menu modal component props.
 *
 * @param modalHall - The dining venue to display the menu for.
 * @param setModalHall - The function to set the modal hall.
 * @param showNutrition - Whether to show nutrition information.
 * @returns The hall menu modal component
 */
const HallMenuModal = ({
  modalHall,
  setModalHall,
  showNutrition,
  showDietaryTags = true,
  showAllergenTags = true,
}: {
  modalHall: any;
  setModalHall: any;
  showNutrition: boolean;
  showDietaryTags?: boolean;
  showAllergenTags?: boolean;
}) => {
  const [sortOption, setSortOption] = useState<MenuSortOption>('Best');
  const [toggledColumns, setToggledColumns] = useState<Column[]>(COLUMNS);
  const foldDropdowns = useMediaQuery('(max-width: 800px)');

  // Update the toggled columns when the show nutrition changes.
  useEffect(() => {
    if (showNutrition) {
      setToggledColumns(COLUMNS);
    } else {
      setToggledColumns(['Ingredients', 'Allergens']);
    }
  }, [showNutrition]);

  if (!modalHall) return null;

  // Render the hall menu modal.
  return (
    <Dialog
      isShown={!!modalHall}
      title={
        <Pane display='flex' alignItems='center' justifyContent='space-between' width='100%'>
          <Pane>{modalHall.name}</Pane>
          <Pane display='flex' alignItems='center' justifyContent='flex-end' gap={minorScale(2)}>
            <Pane
              display='flex'
              flexDirection={foldDropdowns ? 'column' : 'row'}
              alignItems='center'
              justifyContent='flex-end'
              gap={foldDropdowns ? minorScale(2) : minorScale(4)}
              marginRight={minorScale(4)}
            >
              {/* Render the column visibility dropdown. */}
              <ColumnVisibilityDropdown
                toggledColumns={toggledColumns}
                setToggledColumns={setToggledColumns}
              />
              {/* Render the sort dropdown. */}
              <Pane width={130}>
                <SortDropdown
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  showLabel={false}
                />
              </Pane>
            </Pane>
          </Pane>
        </Pane>
      }
      onCloseComplete={() => setModalHall(null)}
      hasFooter={false}
      width='80vw'
    >
      {/* Render the menu section. */}
      <Pane
        display='flex'
        flexDirection='column'
        paddingBottom={majorScale(5)}
        gap={minorScale(3)}
        className='overflow-x-hidden'
      >
        <Separator height='1.5px' marginTop={0} />
        <MenuSection
          items={modalHall.menu ?? []}
          showNutrition={showNutrition}
          showDietaryTags={showDietaryTags}
          showAllergenTags={showAllergenTags}
          fullMenu={true}
          toggledColumns={toggledColumns}
          diningHallId={modalHall.name}
        />
      </Pane>
    </Dialog>
  );
};

export default HallMenuModal;
