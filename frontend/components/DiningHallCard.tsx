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
} from 'evergreen-ui';
import MenuSection from './MenuSection';

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
  console.log(hall);
  return (
    <Pane
      key={hall.name}
      background='white'
      borderRadius={15}
      boxShadow='0 2px 8px rgba(0,0,0,0.08)'
      padding={majorScale(3)}
    >
      <Heading size={600} color={theme.colors.green900} marginBottom={minorScale(1)}>
        {hall.name}
      </Heading>

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
        >
          {'More Details'}
        </Button>
      </Pane>
    </Pane>
  );
};

export default DiningHallCard;
