'use client';

import React from 'react';
import { Pane, Text, Link, minorScale, majorScale, useTheme } from 'evergreen-ui';
import { ALLERGENS } from '@/data';
import { ALLERGEN_EMOJI } from '@/styles';

interface MenuSectionProps {
  label: string;
  items: any[];
  showNutrition?: boolean;
  limitItems?: boolean;
  menuId: string;
}

const MenuSection: React.FC<MenuSectionProps> = ({
  label,
  items,
  showNutrition,
  limitItems,
  menuId,
}) => {
  const theme = useTheme();
  const displayItems = limitItems ? items.slice(0, 2).reverse() : items;

  const showAllergens = (item: any) => {
    let itemAllergens = item?.allergens || [];
    if (itemAllergens.length === 0) {
      itemAllergens = Array.from(ALLERGENS).filter((a) =>
        item?.description?.toLowerCase().includes(a.toLowerCase())
      );
    }

    if (itemAllergens.length === 0) {
      return (
        <Text color='muted' fontStyle='italic'>
          No allergens
        </Text>
      );
    }

    return itemAllergens.map((allergen: string) => (
      <Pane
        key={allergen}
        display='inline-flex'
        alignItems='center'
        justifyContent='center'
        width={24}
        height={24}
        borderRadius={12}
        background={theme.colors.green100}
        border={`1px solid ${theme.colors.green700}`}
      >
        <Text>{ALLERGEN_EMOJI[allergen as keyof typeof ALLERGEN_EMOJI]}</Text>
      </Pane>
    ));
  };

  const MenuItemRow = ({ item }: { item: any }) => {
    const calories = item?.nutrition?.calories ?? '';
    const protein = item?.nutrition?.protein ? `${item?.nutrition?.protein} g` : '';
    const sodium = item?.nutrition?.sodium ? `${item?.nutrition?.sodium} mg` : '';
    const totalFat = item?.nutrition?.totalFat ? `${item?.nutrition?.totalFat} g` : '';
    const totalCarbs = item?.nutrition?.totalCarbohydrates
      ? `${item?.nutrition?.totalCarbohydrates} g`
      : '';
    const apiId = item?.apiId;
    const nutritionLink = `/nutrition?id=${apiId}&menuId=${menuId}`;

    return (
      <React.Fragment key={apiId}>
        <Pane
          display='grid'
          gridTemplateColumns={
            showNutrition ? (limitItems ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 1fr 1fr') : '1fr'
          }
          rowGap={minorScale(1)}
          marginTop={minorScale(1)}
          borderBottom={`0.9px solid ${theme.colors.green300}`}
        >
          <Pane display='flex' flexDirection='column' marginY={majorScale(1)}>
            <Link href={nutritionLink}>
              <Text color='green700' fontWeight={500}>
                {item.name}
              </Text>
            </Link>
            <Pane display='flex' gap={minorScale(1)} marginTop={minorScale(1)}>
              {showAllergens(item)}
            </Pane>
          </Pane>
          {showNutrition && (
            <>
              <Text size={300} textAlign='right' marginY={majorScale(1)}>
                {calories}
              </Text>
              <Text size={300} textAlign='right' marginY={majorScale(1)}>
                {protein}
              </Text>
              <Text size={300} textAlign='right' marginY={majorScale(1)}>
                {sodium}
              </Text>
              {!limitItems && (
                <>
                  <Text size={300} textAlign='right' marginY={majorScale(1)}>
                    {totalFat}
                  </Text>
                  <Text size={300} textAlign='right' marginY={majorScale(1)}>
                    {totalCarbs}
                  </Text>
                </>
              )}
            </>
          )}
        </Pane>
      </React.Fragment>
    );
  };

  return (
    <Pane marginBottom={majorScale(3)}>
      {/* Section header */}
      <Pane
        display='grid'
        gridTemplateColumns={
          showNutrition ? (limitItems ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 1fr 1fr') : '1fr'
        }
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
            </Text>
            <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
              Protein
            </Text>
            <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
              Sodium
            </Text>
            {!limitItems && (
              <>
                <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                  Fat
                </Text>
                <Text size={300} fontWeight={500} textAlign='right' className='my-auto'>
                  Carbs
                </Text>
              </>
            )}
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
            <MenuItemRow key={item.apiId} item={item} />
          ))}
        </Pane>
      )}
    </Pane>
  );
};

export default MenuSection;
