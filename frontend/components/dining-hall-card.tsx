// components/DiningHallCard.tsx
import React from 'react';
import {
  Pane,
  Text,
  Button,
  ChevronDownIcon,
  minorScale,
  majorScale,
  PinIcon,
} from 'evergreen-ui';
import MenuSection from './menu-selection';

import rockyBanner from '../public/images/banners/rockybanner.png';
import forbesBanner from '../public/images/banners/forbesbanner.png';
import whitmanBanner from '../public/images/banners/whitmanbanner.png';
import matheyBanner from '../public/images/banners/rockybanner.png';
import yehBanner from '../public/images/banners/yehbanner.png';
import cjlBanner from '../public/images/banners/cjl-banner.png';
import gradBanner from '../public/images/banners/gradbanner.png';
import { StaticImageData } from 'next/image';
import { UIVenue } from '@/app/menu/types';

interface DiningHallCardProps {
  hall: UIVenue;
  setModalHall: (hall: UIVenue) => void;
  ALLERGEN_EMOJI: Record<string, string>;
  theme: any;
  showNutrition: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
}

const hallImages: Record<string, StaticImageData> = {
  'Rockefeller College': rockyBanner,
  'Forbes College': forbesBanner,
  'Mathey College': matheyBanner,
  'Whitman & Butler Colleges': whitmanBanner,
  'Yeh College & NCW': yehBanner,
  'Center for Jewish Life': cjlBanner,
  'Graduate College': gradBanner,
};

const DiningHallCard: React.FC<DiningHallCardProps> = ({
  hall,
  setModalHall,
  ALLERGEN_EMOJI,
  theme,
  showNutrition,
  isPinned,
  onPinToggle,
}) => {
  const imageSrc = hallImages[hall.name];

  return (
    <Pane
      key={hall.name}
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
            {hall.name}
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
          <img src={imageSrc?.src} className='h-full my-auto w-auto' alt={hall.name} />
        </Pane>
      </Pane>

      <MenuSection
        label='Main Entrée'
        items={hall.items['Main Entrée']} // <-- This is UIMenuItem[] with id: number
        allergens={hall.allergens}
        calories={hall.calories}
        protein={hall.protein}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        showNutrition={showNutrition}
        limitItems={true}
      />

      <MenuSection
        label='Vegetarian + Vegan Entrée'
        items={hall.items['Vegetarian + Vegan Entrée']}
        allergens={hall.allergens}
        calories={hall.calories}
        protein={hall.protein}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        showNutrition={showNutrition}
        limitItems={true}
      />

      <MenuSection
        label='Soups'
        items={hall.items['Soups']}
        allergens={hall.allergens}
        calories={hall.calories}
        protein={hall.protein}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        showNutrition={showNutrition}
        limitItems={true}
      />
      {/* This Pane with 'mt-auto' will now be pushed to the bottom of the flex column */}
      <Pane display='flex' justifyContent='center' className='mt-auto'>
        <Button
          appearance='minimal'
          iconBefore={<ChevronDownIcon />}
          onClick={() => setModalHall(hall)}
          className='w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold'
        >
          {'More Details'}
        </Button>
      </Pane>
    </Pane>
  );
};

export default DiningHallCard;
