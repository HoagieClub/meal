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
import React, { useState } from 'react';
import MenuSection from './menu-selection';
import { Separator } from '@/components/ui/separator';
import SortDropdown, { MenuSortOption } from './sort-dropdown';
import ColumnVisibilityDropdown, { ColumnVisibility } from './column-visibility-dropdown';

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
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    calories: true,
    protein: true,
    sodium: true,
    fat: true,
    carbs: true,
    ingredients: true,
    allergens: true,
  });

  if (!modalHall) return null;

  return (
    <Dialog
      isShown={!!modalHall}
      title={`${modalHall.name} - Full Menu`}
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
        <Pane
          display='flex'
          alignItems='center'
          justifyContent='flex-end'
          gap={minorScale(4)}
          marginBottom={minorScale(2)}
        >
          <ColumnVisibilityDropdown
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
          />
          <SortDropdown sortOption={sortOption} setSortOption={setSortOption} showLabel={false} />
        </Pane>
        <Separator height='1.5px' marginTop={0} />
        <MenuSection
          label='Menu'
          items={modalHall.menu ?? []}
          showNutrition={showNutrition}
          limitItems={false}
        />
      </Pane>
    </Dialog>
  );
};

export default HallMenuModal;
