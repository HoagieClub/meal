'use client';

import React from 'react';
import { Pane, Heading, Text, majorScale, minorScale } from 'evergreen-ui';
import { AllergenKey } from '../types';
import { ALLERGENS, ALLERGEN_EMOJI } from '../data';

interface AllergenSidebarProps {
  selected: string[];
  theme: any;
  setAppliedAllergens: any;
}

export default function AllergenSidebar({
  selected,
  theme,
  setAppliedAllergens,
}: AllergenSidebarProps) {
  const ICON_SIZE = 28;

  return (
    <Pane
      className='hidden sm:flex'
      flexDirection='column'
      width={200}
      padding={majorScale(3)}
      overflowY='auto'
      zIndex={2}
    >
      <Heading size={600} color={theme.colors.green900}>
        Allergens to Avoid
      </Heading>
      <Pane marginTop={majorScale(2)} display='flex' flexDirection='column' gap={majorScale(2)}>
        {ALLERGENS.map((allergen: AllergenKey) => {
          const isSelected = selected.includes(allergen);
          const allergenKey = allergen.toLowerCase();
          const emojiForAllergen = ALLERGEN_EMOJI[allergenKey];
          const backgroundColor = isSelected ? theme.colors.red100 : theme.colors.gray100;

          return (
            <Pane
              key={allergen}
              display='flex'
              alignItems='center'
              cursor='pointer'
              opacity={isSelected ? 1.0 : 0.6}
              onClick={() => {
                setAppliedAllergens((prev: AllergenKey[]) =>
                  prev.includes(allergen as AllergenKey)
                    ? prev.filter((a: AllergenKey) => a !== allergen)
                    : [...prev, allergen]
                );
              }}
              title={
                isSelected
                  ? `Hiding items containing ${allergen}`
                  : `Click to hide items containing ${allergen}`
              }
            >
              <Pane
                width={ICON_SIZE}
                height={ICON_SIZE}
                display='inline-flex'
                alignItems='center'
                justifyContent='center'
                borderRadius={ICON_SIZE / 2}
                background={backgroundColor}
                marginRight={minorScale(1)}
              >
                <Text size={200}>{emojiForAllergen}</Text>
              </Pane>
              <Text size={400} color={theme.colors.green900} fontWeight={isSelected ? 600 : 400}>
                {allergen}
              </Text>
            </Pane>
          );
        })}
      </Pane>
    </Pane>
  );
}
