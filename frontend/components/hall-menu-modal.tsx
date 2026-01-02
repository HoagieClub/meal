'use client';

import { Dialog, Pane, majorScale, minorScale } from 'evergreen-ui';
import React from 'react';
import MenuSection from './menu-selection';
import { Separator } from './ui/separator';

const HallMenuModal: React.FC<{
  modalHall: any | null;
  setModalHall: (hall: any | null) => void;
  showNutrition: boolean;
}> = ({ modalHall, setModalHall, showNutrition }) => {
  if (!modalHall) return null;

  const menuItems = modalHall?.menu ?? [];
  const mainEntreeMenuItems = [];
  const veganEntreeMenuItems = [];
  for (const menuItem of menuItems) {
    const dietaryFlags = menuItem?.nutrition?.dietaryFlags ?? [];
    const dietaryFlagsLower = dietaryFlags.map((flag: string) => flag.toLowerCase());
    if (dietaryFlagsLower.includes('vegetarian') || dietaryFlagsLower.includes('vegan')) {
      veganEntreeMenuItems.push(menuItem);
    } else {
      mainEntreeMenuItems.push(menuItem);
    }
  }

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
        <MenuSection
          label='Main Entrée'
          items={mainEntreeMenuItems}
          showNutrition={showNutrition}
          limitItems={false}
        />

        <Separator height='1.5px' />
        <MenuSection
          label='Vegan Entrée'
          items={veganEntreeMenuItems}
          showNutrition={showNutrition}
          limitItems={false}
        />
      </Pane>
    </Dialog>
  );
};

export default HallMenuModal;
