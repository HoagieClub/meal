'use client';

import React from 'react';
import { Pane, Text, Link, minorScale, majorScale, useTheme } from 'evergreen-ui';

interface UIMenuItem {
  name: string;
  id: string;
  description: string;
  link: string;
  allergens?: string[];
  ingredients?: string[];
}

interface MenuSectionProps {
  label: string;
  items: UIMenuItem[];
  allergens: Set<string>;
  calories: Record<string, number>;
  protein: Record<string, number>;
  ALLERGEN_EMOJI: Record<string, string>;
  showNutrition?: boolean;
  limitItems?: boolean;
}

const MenuSection: React.FC<MenuSectionProps> = ({
  label,
  items,
  allergens,
  calories,
  protein,
  ALLERGEN_EMOJI,
  showNutrition,
  limitItems,
}) => {
  const theme = useTheme();

  const displayItems = limitItems ? items.slice(0, 3).reverse() : items;

  return (
    <Pane marginBottom={majorScale(3)}>
      {/* Section header */}
      <Pane
        display='grid'
        gridTemplateColumns={showNutrition ? '2fr 1fr 1fr' : '1fr'}
        borderBottom={`1px solid ${theme.colors.green300}`}
        paddingBottom={minorScale(1)}
      >
        <Text fontSize={14} fontWeight={600} className='my-auto'>
          {label}
        </Text>
        {showNutrition && (
          <>
            <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
              Calories
              <Text size={200} color='muted' display='block'>
                (per serving)
              </Text>
            </Text>
            <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
              Protein (g)
            </Text>
          </>
        )}
      </Pane>

      {/* Items */}
      {displayItems.length === 0 ? (
        <Text size={300} color='muted' fontStyle='italic' marginTop={minorScale(1)}>
          Nothing available
        </Text>
      ) : (
        <Pane marginTop={minorScale(1)}>
          {displayItems.map((item) => (
            <React.Fragment key={item.id}>
              <Pane
                display='grid'
                gridTemplateColumns={showNutrition ? '2fr 1fr 1fr' : '1fr'}
                rowGap={minorScale(1)}
                marginTop={minorScale(1)}
                borderBottom={`0.9px solid ${theme.colors.green300}`}
              >
                <Pane display='flex' flexDirection='column' marginY={majorScale(1)}>
                  <Link href={`/nutrition?id=${item.id}`}>
                    <Text color='green700' fontWeight={500}>
                      {item.name}
                    </Text>
                  </Link>
                  <Pane display='flex' gap={minorScale(1)} marginTop={minorScale(1)}>
                    {(() => {
                      // Use the structured allergens from the API if available
                      const itemAllergens = item.allergens || [];

                      // Fallback to parsing description if allergens not provided
                      const matched =
                        itemAllergens.length > 0
                          ? itemAllergens
                          : Array.from(allergens).filter((a) =>
                              item.description.toLowerCase().includes(a.toLowerCase())
                            );
                      console.log(matched);
                      return matched.length > 0 && matched[0] != '' ? (
                        matched.map((a) => (
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
                            <Text>{ALLERGEN_EMOJI[a.toLowerCase()]}</Text>
                          </Pane>
                        ))
                      ) : (
                        <Text color='muted' fontStyle='italic'>
                          No allergens
                        </Text>
                      );
                    })()}
                  </Pane>
                </Pane>
                {showNutrition && (
                  <>
                    <Text size={300} textAlign='right' marginY={majorScale(1)}>
                      {calories[item.name]}
                    </Text>
                    <Text size={300} textAlign='right' marginY={majorScale(1)}>
                      {protein[item.name]}
                    </Text>
                  </>
                )}
              </Pane>
            </React.Fragment>
          ))}
        </Pane>
      )}
    </Pane>
  );
};

export default MenuSection;
