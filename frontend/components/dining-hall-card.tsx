// components/DiningHallCard.tsx
import {
  Button,
  ChevronDownIcon,
  majorScale,
  minorScale,
  Pane,
  PinIcon,
  Text,
  useTheme,
} from 'evergreen-ui';
import React from 'react';
import MenuSection from './menu-selection';

import { UIVenue } from '@/app/menu/types';
import { ALLERGEN_EMOJI } from '@/styles';
import { HALL_BANNER_MAP } from '@/styles';

interface DiningHallCardProps {
  diningHall: UIVenue;
  setModalHall: (hall: UIVenue | null) => void;
  showNutrition: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
}

const DiningHallCard: React.FC<DiningHallCardProps> = ({
  diningHall,
  setModalHall,
  showNutrition,
  isPinned,
  onPinToggle,
}) => {
  const theme = useTheme();
  const imageSrc = HALL_BANNER_MAP[diningHall.name as keyof typeof HALL_BANNER_MAP];

  return (
    <Pane
      key={diningHall.name}
      background='white'
      borderRadius={15}
      boxShadow='0 2px 8px rgba(0,0,0,0.08)'
      padding={majorScale(3)}
      display='flex'
      flexDirection='column'
      height='100%'
    >
      <Pane
        display='flex'
        alignItems='center'
        marginBottom={majorScale(2)}
        background={theme.colors.gray100}
        className='py-4 border relative border-gray-300 rounded-md flex items-center'
      >
        {/* 1. Pill with pin + name */}
        <Pane
          display='flex'
          alignItems='center'
          borderRadius={majorScale(1)}
          paddingX={majorScale(2)}
          paddingY={minorScale(1)}
        >
          <Text size={700} fontWeight={600} color={theme.colors.gray900}>
            {diningHall.name}
          </Text>
        </Pane>

        {/* 2. Overlapping crests */}
        <Pane className='flex items-center right-[-1rem] h-[140%] absolute'>
          <Pane
            onClick={onPinToggle}
            cursor='pointer'
            padding={minorScale(1)}
            marginRight={minorScale(1)} // Kept original spacing logic
            className='mr-4' // Kept original class
            display='flex'
            alignItems='center'
            title={isPinned ? 'Unpin hall' : 'Pin hall'} // Added title
          >
            <PinIcon
              size={16}
              color={isPinned ? theme.colors.green700 : theme.colors.gray700} // Dynamic color
            />
          </Pane>
          <img src={imageSrc?.src} className='h-full my-auto w-auto' alt={diningHall.name} />
        </Pane>
      </Pane>

      <MenuSection
        label='Main Entrée'
        items={diningHall.items['Main Entrée']} // <-- This is UIMenuItem[] with id: number
        allergens={diningHall.allergens}
        calories={diningHall.calories}
        protein={diningHall.protein}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        showNutrition={showNutrition}
        limitItems={true}
      />

      <MenuSection
        label='Vegan Entrée'
        items={diningHall.items['Vegan Entrée']}
        allergens={diningHall.allergens}
        calories={diningHall.calories}
        protein={diningHall.protein}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        showNutrition={showNutrition}
        limitItems={true}
      />

      <MenuSection
        label='Soups'
        items={diningHall.items['Soups']}
        allergens={diningHall.allergens}
        calories={diningHall.calories}
        protein={diningHall.protein}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        showNutrition={showNutrition}
        limitItems={true}
      />
      {/* This Pane with 'mt-auto' will now be pushed to the bottom of the flex column */}
      <Pane display='flex' justifyContent='center' className='mt-auto'>
        <Button
          appearance='minimal'
          iconBefore={<ChevronDownIcon />}
          onClick={() => setModalHall(diningHall)}
          className='w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold'
        >
          {'More Details'}
        </Button>
      </Pane>
    </Pane>
  );
};

export default DiningHallCard;
