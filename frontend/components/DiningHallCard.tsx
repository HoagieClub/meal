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
import Link from 'next/link';

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
}

const Section = ({
  title,
  items,
  allergens,
  calories,
  protein,
  ALLERGEN_EMOJI,
  theme,
}: {
  title: string;
  items: UIMenuItem[];
  allergens: Set<string>;
  calories: Record<string, number>;
  protein: Record<string, number>;
  ALLERGEN_EMOJI: Record<string, string>;
  theme: any;
}) => (
  <Pane marginTop={majorScale(2)}>
    <Text size={300} fontWeight={600}>
      {title}
    </Text>
    {items.length === 0 ? (
      <Pane>
        <Text size={300} color='muted' fontStyle='italic' marginTop={minorScale(1)}>
          Nothing available
        </Text>
      </Pane>
    ) : (
      <Pane
        display='grid'
        gridTemplateColumns='2fr 1fr 1fr'
        rowGap={minorScale(1)}
        marginTop={minorScale(1)}
      >
        {items.map((item) => (
          <React.Fragment key={item.name}>
            <Pane display='flex' flexDirection='column'>
              <Link href={item.link}>
                <Text color='green800'>{item.name}</Text>
              </Link>
              <Pane display='flex' gap={minorScale(1)} marginTop={minorScale(1)}>
                {Array.from(allergens)
                  .filter((a) => item.description.toLowerCase().includes(a.toLowerCase()))
                  .map((a) => (
                    <Pane
                      key={a}
                      display='inline-flex'
                      alignItems='center'
                      justifyContent='center'
                      width={24}
                      height={24}
                      borderRadius={12}
                      background={theme.colors.green100}
                      border={`1px solid ${theme.colors.green700}`}
                    >
                      <Text size={200}>{ALLERGEN_EMOJI[a.toLowerCase()]}</Text>
                    </Pane>
                  ))}
              </Pane>
            </Pane>
            <Text size={300} textAlign='right'>
              {calories[item.name]}
            </Text>
            <Text size={300} textAlign='right'>
              {protein[item.name]}
            </Text>
          </React.Fragment>
        ))}
      </Pane>
    )}
  </Pane>
);

const DiningHallCard: React.FC<DiningHallCardProps> = ({
  hall,
  setModalHall,
  ALLERGEN_EMOJI,
  theme,
}) => {
  return (
    <Pane
      key={hall.name}
      background='white'
      borderRadius={8}
      boxShadow='0 2px 8px rgba(0,0,0,0.08)'
      padding={majorScale(3)}
    >
      <Heading size={600} color={theme.colors.green900} marginBottom={minorScale(1)}>
        {hall.name}
      </Heading>

      <Pane
        display='grid'
        gridTemplateColumns='2fr 1fr 1fr'
        borderBottom={`1px solid ${theme.colors.green300}`}
        paddingBottom={minorScale(1)}
      >
        <Text size={300} fontWeight={500} />
        <Text size={300} fontWeight={500} textAlign='right'>
          Calories
          <Text size={200} color='muted' display='block'>
            (per serving)
          </Text>
        </Text>
        <Text size={300} fontWeight={500} textAlign='right'>
          Protein (g)
        </Text>
      </Pane>

      <Section
        title='Main Entrée'
        items={hall.items['Main Entrée']}
        allergens={hall.allergens}
        calories={hall.calories}
        protein={hall.protein}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        theme={theme}
      />

      <Section
        title='Vegetarian + Vegan Entrée'
        items={hall.items['Vegetarian + Vegan Entrée']}
        allergens={hall.allergens}
        calories={hall.calories}
        protein={hall.protein}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        theme={theme}
      />
      <Section
        title='Soups'
        items={hall.items['Soups']}
        allergens={hall.allergens}
        calories={hall.calories}
        protein={hall.protein}
        ALLERGEN_EMOJI={ALLERGEN_EMOJI}
        theme={theme}
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
