/**
 * @overview Favorite/Bookmark buttons component for nutrition page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 *
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import React from 'react';
import { Pane, Text, useTheme, majorScale } from 'evergreen-ui';
import { MenuItemInteraction } from '@/types/dining';
import { useMenuItemFavoriteBookmark } from '@/hooks/use-menu-item-favorite-bookmark';

/**
 * Favorite/Bookmark button props.
 *
 * @param emoji - The emoji to display.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @param title - The title of the interaction.
 * @param activeBgColor - The background color of the active interaction.
 * @returns A React component.
 */
interface FavoriteBookmarkButtonProps {
  emoji: string;
  isActive: boolean;
  onClick: () => void;
  title: string;
  activeBgColor: string;
}

/**
 * Favorite/Bookmark button component.
 *
 * @param emoji - The emoji to display.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @param title - The title of the interaction.
 * @param activeBgColor - The background color of the active interaction.
 * @returns A React component.
 */
const FavoriteBookmarkButton = ({
  emoji,
  isActive,
  onClick,
  title,
  activeBgColor,
}: FavoriteBookmarkButtonProps) => {
  const theme = useTheme();

  return (
    <Pane
      onClick={onClick}
      cursor='pointer'
      display='flex'
      alignItems='center'
      justifyContent='center'
      width={36}
      height={36}
      borderRadius={6}
      background={isActive ? activeBgColor : 'transparent'}
      title={title}
    >
      <Text fontSize={20} lineHeight={1}>
        {emoji}
      </Text>
    </Pane>
  );
};

/**
 * Favorite button component.
 *
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @returns A React component.
 */
const FavoriteButton = ({ isActive, onClick }: { isActive: boolean; onClick: () => void }) => {
  const theme = useTheme();
  return (
    <FavoriteBookmarkButton
      emoji='⭐'
      isActive={isActive}
      onClick={onClick}
      title='Favorite this item'
      activeBgColor={theme.colors.yellow100}
    />
  );
};

/**
 * Bookmark button component.
 *
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @returns A React component.
 */
const BookmarkButton = ({ isActive, onClick }: { isActive: boolean; onClick: () => void }) => {
  const theme = useTheme();
  return (
    <FavoriteBookmarkButton
      emoji='📌'
      isActive={isActive}
      onClick={onClick}
      title='Save for later'
      activeBgColor={theme.colors.red100}
    />
  );
};

/**
 * Favorite/Bookmark buttons component.
 *
 * @param menuItemApiId - The API ID of the menu item.
 * @param menuItemInteraction - The interaction data for the menu item.
 * @returns A React component.
 */
export default function FavoriteBookmarkButtons({
  menuItemApiId,
  menuItemInteraction,
}: {
  menuItemApiId: number;
  menuItemInteraction: MenuItemInteraction;
}) {
  const { favorited, savedForLater, handleFavorite, handleBookmark } = useMenuItemFavoriteBookmark(
    menuItemApiId,
    menuItemInteraction
  );

  // Render the favorite/bookmark buttons
  return (
    <Pane display='flex' alignItems='center' gap={majorScale(1)}>
      <FavoriteButton isActive={favorited} onClick={handleFavorite} />
      <BookmarkButton isActive={savedForLater} onClick={handleBookmark} />
    </Pane>
  );
}
