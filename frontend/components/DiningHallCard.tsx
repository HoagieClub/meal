// components/DiningHallCard.tsx
import React from 'react';
import {
  Pane,
  Heading,
  Text,
  Button,
  ChevronDownIcon,
  ChevronUpIcon,
  minorScale,
  majorScale,
  Avatar,
  PinIcon,
} from 'evergreen-ui';
import MenuSection from './MenuSection';

// ——— Import all your banners + a default ———
import rockyBanner from '../public/images/banners/rockybanner.png';
import forbesBanner from '../public/images/banners/forbesbanner.png';
import whitmanBanner from '../public/images/banners/whitmanbanner.png';
import matheyBanner from '../public/images/banners/rockybanner.png';
import yehBanner from '../public/images/banners/yehbanner.png';
import cjlBanner from '../public/images/banners/cjl-banner.png';
import gradBanner from '../public/images/banners/gradbanner.png';

interface UIMenuItem {
  name: string;
  description: string;
  link: string;
}

interface DiningHallCardProps {
  hall: {
    name: string;
    items: Record<'Main Entrée' | 'Vegetarian + Vegan Entrée' | 'Soups', UIMenuItem[]>;
    allergens: Set<string>;
    calories: Record<string, number>;
    protein: Record<string, number>;
  };
  setModalHall: (hall: DiningHallCardProps['hall']) => void;
  ALLERGEN_EMOJI: Record<string, string>;
  theme: any;
  showNutrition: boolean;
}

const hallImages: Record<string, string> = {
  'Rockefeller College': rockyBanner,
  'Forbes College': forbesBanner,
  'Mathey College': matheyBanner,
  'Whitman & Butler Colleges': whitmanBanner,
  'Yeh College & New College West': yehBanner,
  'Center for Jewish Life': cjlBanner,
  'Graduate College': gradBanner,
};

interface UIMenuItem {
  name: string;
  description: string;
  link: string;
}

interface DiningHallCardProps {
  hall: {
    name: string;
    items: Record<'Main Entrée' | 'Vegetarian + Vegan Entrée' | 'Soups', UIMenuItem[]>;
    allergens: Set<string>;
    calories: Record<string, number>;
    protein: Record<string, number>;
  };
  setModalHall: (hall: DiningHallCardProps['hall']) => void;
  ALLERGEN_EMOJI: Record<string, string>;
  theme: any;
  showNutrition: boolean;
}

const DiningHallCard: React.FC<DiningHallCardProps> = ({
  hall,
  setModalHall,
  ALLERGEN_EMOJI,
  theme,
  showNutrition,
}) => {
  const imageSrc = hallImages[hall.name];
  console.log(imageSrc);
  return (
    <Pane
      key={hall.name}
      background='white'
      borderRadius={15}
      boxShadow='0 2px 8px rgba(0,0,0,0.08)'
      padding={majorScale(3)}
    >
      {/* <Pane display='flex' alignItems='center' marginBottom={minorScale(2)}>
        <img src={imageSrc?.src} name={hall.name} />
        <Heading size={600} color={theme.colors.green900}>
          {hall.name}
        </Heading>
      </Pane> */}

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
          <PinIcon
            size={16}
            color={theme.colors.gray700}
            marginRight={minorScale(1)}
            className='mr-4'
          />
          <img src={imageSrc?.src} className='h-full my-auto w-auto' alt={hall.name} />
        </Pane>
      </Pane>

      {/* <Pane
        display='grid'
        gridTemplateColumns={showNutrition?'2fr 1fr 1fr':''}
        borderBottom={`1px solid ${theme.colors.green300}`}
        paddingBottom={minorScale(1)}
      >
        <Text size={300} fontWeight={500} />
        {showNutrition&&
        <>
        <Text size={300} fontWeight={500} textAlign='right'>
          Calories
          <Text size={200} color='muted' display='block'>
            (per serving)
          </Text>
        </Text>
        <Text size={300} fontWeight={500} textAlign='right'>
          Protein (g)
        </Text></>}
      </Pane> */}

      <MenuSection
        label='Main Entrée'
        items={hall.items['Main Entrée']}
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
      <Pane display='flex' justifyContent='center' marginTop={majorScale(3)}>
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
