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
import MenuSection, { Column } from './menu-selection';
import { Separator } from '@/components/ui/separator';
import SortDropdown, { MenuSortOption } from './sort-dropdown';
import { useMediaQuery } from '@/hooks/use-media-query';
import ColumnVisibilityDropdown from './column-visibility-dropdown';
import { COLUMNS } from './menu-selection';

/**
 * Props for the HallMenuModal component.
 *
 * @param modalHall - The dining venue to display the menu for.
 * @param setModalHall - The function to set the modal hall.
 * @param showNutrition - Whether to show nutrition information.
 */
interface HallMenuModalProps {
  modalHall: any;
  setModalHall: any;
  showNutrition: boolean;
}

/**
 * Hall menu modal component.
 *
 * @returns The hall menu modal component
 */
const HallMenuModal: React.FC<HallMenuModalProps> = ({
  modalHall,
  setModalHall,
  showNutrition,
}) => {
  const [sortOption, setSortOption] = useState<MenuSortOption>('best');
  const [toggledColumns, setToggledColumns] = useState<Column[]>(COLUMNS);
  const foldDropdowns = useMediaQuery('(max-width: 800px)');

  useEffect(() => {
    if (showNutrition) {
      setToggledColumns(COLUMNS);
    } else {
      setToggledColumns(['Ingredients', 'Allergens']);
    }
  }, [showNutrition]);

  if (!modalHall) return null;

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
              <ColumnVisibilityDropdown
                showNutrition={showNutrition}
                toggledColumns={toggledColumns}
                setToggledColumns={setToggledColumns}
              />
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
          fullMenu={true}
          toggledColumns={toggledColumns}
        />
      </Pane>
    </Dialog>
  );
};

export default HallMenuModal;
