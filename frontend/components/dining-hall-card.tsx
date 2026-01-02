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

import { UIVenue } from '@/data';
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

  // Divide items into main entrees and vegan entrees
  const menuItems = diningHall?.menu ?? [];
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

        <Pane className='flex items-center right-[-1rem] h-[140%] absolute'>
          <Pane
            onClick={onPinToggle}
            cursor='pointer'
            padding={minorScale(1)}
            marginRight={minorScale(1)}
            className='mr-4'
            display='flex'
            alignItems='center'
            title={isPinned ? 'Unpin hall' : 'Pin hall'}
          >
            <PinIcon
              size={16}
              color={isPinned ? theme.colors.green700 : theme.colors.gray700} // Dynamic color
            />
          </Pane>
          <img src={imageSrc?.src} className='h-full my-auto w-auto' alt={diningHall.name} />
        </Pane>
      </Pane>

      {mainEntreeMenuItems.length > 0 && (
        <MenuSection
          label='Main Entrée'
          items={mainEntreeMenuItems}
          showNutrition={showNutrition}
          limitItems={true}
        />
      )}
      {veganEntreeMenuItems.length > 0 && (
        <MenuSection
          label='Vegan Entrée'
          items={veganEntreeMenuItems}
          showNutrition={showNutrition}
          limitItems={true}
        />
      )}

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
