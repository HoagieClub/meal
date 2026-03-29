'use client';

import React from 'react';
import { Pane, Heading, majorScale, useTheme } from 'evergreen-ui';
import MenuItemRow from '@/components/dining-hall-card/menu-item-row';

export default function RecommendedSection({ items }: { items: any[] }) {
  const theme = useTheme();

  if (items.length === 0) return null;

  return (
    <Pane marginBottom={majorScale(2)}>
      <Heading
        size={500}
        color={theme.colors.green700}
        fontWeight={700}
        marginBottom={majorScale(1)}
      >
        Recommended for You
      </Heading>
      <Pane
        background="white"
        borderRadius={8}
        padding={majorScale(1)}
        elevation={1}
      >
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} diningHallId="recommended" />
        ))}
      </Pane>
    </Pane>
  );
}
