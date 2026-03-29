'use client';

import React from 'react';
import { Pane, Heading, Text, majorScale, useTheme } from 'evergreen-ui';
import MenuItemRow from '@/components/dining-hall-card/menu-item-row';

function LabeledMenuItemRow({ item }: { item: any }) {
  return (
    <Pane>
      {item.diningHall && (
        <Text size={300} color="muted" paddingLeft={majorScale(1)} paddingTop={majorScale(1)} display="block">
          {item.diningHall}
        </Text>
      )}
      <MenuItemRow item={item} diningHallId="recommended" />
    </Pane>
  );
}

export default function RecommendedSection({ items, favoritedItems, popularItems }: { items: any[]; favoritedItems: any[]; popularItems: any[] }) {
  const theme = useTheme();

  return (
    <Pane marginBottom={majorScale(2)}>
      <Pane display="flex" gap={majorScale(2)}>
        <Pane flex={1} minWidth={0}>
          <Heading
            size={500}
            color={theme.colors.green700}
            fontWeight={700}
            marginBottom={majorScale(1)}
          >
            Popular
          </Heading>
          <Pane
            background="white"
            borderRadius={8}
            padding={majorScale(1)}
            elevation={1}
          >
            {popularItems.length > 0 ? (
              popularItems.map((item) => (
                <LabeledMenuItemRow key={item.id} item={item} />
              ))
            ) : (
              <Pane padding={majorScale(2)} textAlign="center">
                <Heading size={300} color="muted">No popular items yet</Heading>
              </Pane>
            )}
          </Pane>
        </Pane>

        <Pane flex={1} minWidth={0}>
          <Heading
            size={500}
            color={theme.colors.green700}
            fontWeight={700}
            marginBottom={majorScale(1)}
          >
            Favorites
          </Heading>
          <Pane
            background="white"
            borderRadius={8}
            padding={majorScale(1)}
            elevation={1}
          >
            {favoritedItems.length > 0 ? (
              favoritedItems.map((item) => (
                <LabeledMenuItemRow key={item.id} item={item} />
              ))
            ) : (
              <Pane padding={majorScale(2)} textAlign="center">
                <Heading size={300} color="muted">No favorites today</Heading>
              </Pane>
            )}
          </Pane>
        </Pane>

        <Pane flex={1} minWidth={0}>
          <Heading
            size={500}
            color={theme.colors.green700}
            fontWeight={700}
            marginBottom={majorScale(1)}
          >
            Recommended
          </Heading>
          <Pane
            background="white"
            borderRadius={8}
            padding={majorScale(1)}
            elevation={1}
          >
            {items.length > 0 ? (
              items.map((item) => (
                <LabeledMenuItemRow key={item.id} item={item} />
              ))
            ) : (
              <Pane padding={majorScale(2)} textAlign="center">
                <Heading size={300} color="muted">No recommendations so far</Heading>
              </Pane>
            )}
          </Pane>
        </Pane>
      </Pane>

    </Pane>
  );
}
