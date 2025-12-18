'use client';

import { UIVenue } from '@/app/menu/types';
import { Dialog, Pane, majorScale, minorScale } from 'evergreen-ui';
import React from 'react';
import MenuSection from './menu-selection';
import { Separator } from './ui/separator';
import { ALLERGEN_EMOJI } from '@/styles';

const HallMenuModal: React.FC<{
  modalHall: UIVenue | null;
  setModalHall: (hall: UIVenue | null) => void;
  showNutrition: boolean;
}> = ({ modalHall, setModalHall, showNutrition }) => {
  if (!modalHall) return null;

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
          items={modalHall.items['Main Entrée']}
          allergens={modalHall.allergens}
          calories={modalHall.calories}
          protein={modalHall.protein}
          ALLERGEN_EMOJI={ALLERGEN_EMOJI}
          showNutrition={showNutrition}
        />

        <Separator height='1.5px' />
        <MenuSection
          label='Vegan Entrée'
          items={modalHall.items['Vegan Entrée']}
          allergens={modalHall.allergens}
          calories={modalHall.calories}
          protein={modalHall.protein}
          ALLERGEN_EMOJI={ALLERGEN_EMOJI}
          showNutrition={showNutrition}
        />

        <Separator height='1.5px' />
        <MenuSection
          label='Soups'
          items={modalHall.items['Soups']}
          allergens={modalHall.allergens}
          calories={modalHall.calories}
          protein={modalHall.protein}
          ALLERGEN_EMOJI={ALLERGEN_EMOJI}
          showNutrition={showNutrition}
        />
      </Pane>
    </Dialog>
  );
};

export default HallMenuModal;
