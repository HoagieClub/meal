'use client';

import { Pane, Heading, Text, majorScale, minorScale } from 'evergreen-ui';
import React from 'react';

interface AllergenSidebarProps {
  allergens: string[];
  selected: string[];
  emoji: Record<string, string>;
  onToggle: any;
  theme: any;
}

export default function AllergenSidebar({
  allergens,
  selected,
  emoji,
  onToggle,
  theme,
}: AllergenSidebarProps) {
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
        {allergens.map((a) => {
          const isSelected = selected.includes(a);

          return (
            <Pane
              key={a}
              display='flex'
              alignItems='center'
              cursor='pointer'
              opacity={isSelected ? 1.0 : 0.6}
              onClick={() => onToggle(a)}
              title={
                isSelected ? `Hiding items containing ${a}` : `Click to hide items containing ${a}`
              }
            >
              <Pane
                width={28}
                height={28}
                display='inline-flex'
                alignItems='center'
                justifyContent='center'
                borderRadius={14}
                background={isSelected ? theme.colors.red100 : theme.colors.gray100}
                border={
                  isSelected
                    ? `1px solid ${theme.colors.red500}`
                    : `1px solid ${theme.colors.gray400}`
                }
                marginRight={minorScale(1)}
              >
                <Text size={200}>{emoji[a.toLowerCase()]}</Text>
              </Pane>

              <Text size={400} color={theme.colors.green900} fontWeight={isSelected ? 600 : 400}>
                {a}
              </Text>
            </Pane>
          );
        })}
      </Pane>
    </Pane>
  );
}
