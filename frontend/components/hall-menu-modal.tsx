'use client';

import { UIVenue } from '@/app/menu/types';
import { Dialog, Pane, majorScale, minorScale } from 'evergreen-ui';
import React from 'react';
import MenuSection from './menu-selection';
import { Separator } from './ui/separator';

interface HallMenuModalProps {
  isShown: boolean;
  onClose: () => void;
  hall: UIVenue | null;
  ALLERGEN_EMOJI: any;
}

const HallMenuModal: React.FC<HallMenuModalProps> = ({
  isShown,
  onClose,
  hall,
  ALLERGEN_EMOJI,
}) => {
  if (!hall) return null;

  return (
    <Dialog
      isShown={isShown}
      title={`${hall.name} — Full Menu`}
      onCloseComplete={onClose}
      hasFooter={false}
      width='80vw'
    >
      <Pane display='flex' flexDirection='column' paddingBottom={majorScale(5)} gap={minorScale(3)}>
        <Separator height='1.5px' marginTop={0} />
        <MenuSection
          label='Main Entrée'
          items={hall.items['Main Entrée']}
          allergens={hall.allergens}
          calories={hall.calories}
          protein={hall.protein}
          ALLERGEN_EMOJI={ALLERGEN_EMOJI}
          showNutrition={true}
        />

        <Separator height='1.5px' />
        <MenuSection
          label='Vegan Entrée'
          items={hall.items['Vegan Entrée']}
          allergens={hall.allergens}
          calories={hall.calories}
          protein={hall.protein}
          ALLERGEN_EMOJI={ALLERGEN_EMOJI}
          showNutrition={true}
        />

        <Separator height='1.5px' />
        <MenuSection
          label='Soups'
          items={hall.items['Soups']}
          allergens={hall.allergens}
          calories={hall.calories}
          protein={hall.protein}
          ALLERGEN_EMOJI={ALLERGEN_EMOJI}
          showNutrition={true}
        />
      </Pane>
    </Dialog>
  );
};

export default HallMenuModal;
