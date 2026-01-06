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
import React from 'react';
import MenuSection from './menu-selection';
import { Separator } from './ui/separator';
import { filterMenuItems } from '@/app/menu/actions';

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
 * @param modalHall - The dining venue to display the menu for.
 * @param setModalHall - The function to set the modal hall.
 * @param showNutrition - Whether to show nutrition information.
 */
const HallMenuModal: React.FC<HallMenuModalProps> = ({
  modalHall,
  setModalHall,
  showNutrition,
}) => {
  if (!modalHall) return null;

  // Separate the menu items into main entrée and vegan entrée.
  const { mainEntreeMenuItems, veganEntreeMenuItems } = filterMenuItems(modalHall.menu ?? []);

  return (
    <Dialog
      isShown={!!modalHall}
      title={`${modalHall.name} — Full Menu`}
      onCloseComplete={() => setModalHall(null)}
      hasFooter={false}
      width='80vw'
    >
      <Pane display='flex' flexDirection='column' paddingBottom={majorScale(5)} gap={minorScale(3)}>
        <Separator height='1.5px' marginTop={0} />
        {mainEntreeMenuItems.length > 0 && (
          <MenuSection
            label='Main Entrée'
            items={mainEntreeMenuItems}
            showNutrition={showNutrition}
            limitItems={false}
          />
        )}
        {veganEntreeMenuItems.length > 0 && (
          <MenuSection
            label='Vegan Entrée'
            items={veganEntreeMenuItems}
            showNutrition={showNutrition}
            limitItems={false}
          />
        )}
      </Pane>
    </Dialog>
  );
};

export default HallMenuModal;
