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

import React, { useEffect, useState } from 'react';
import { Pane, Text, useTheme, minorScale, majorScale } from 'evergreen-ui';
import { Heart, Bookmark } from 'lucide-react';
import { updateUserMenuItemInteraction } from '@/lib/next-endpoints';
import { MenuItemInteraction, MenuItemMetrics } from '@/types/dining';

/**
 * Updates favorite for a menu item.
 *
 * @param menuItemApiId - The API ID of the menu item.
 * @param favorited - The favorited status.
 * @returns Promise resolving to boolean indicating success.
 */
const updateFavoriteForMenuItem = async ({
  menuItemApiId,
  favorited,
}: {
  menuItemApiId: number;
  favorited: boolean;
}): Promise<boolean> => {
  try {
    const { status } = await updateUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      favorited: favorited,
    });
    if (status !== 200) throw new Error('Failed to update interaction');
    return true;
  } catch (error) {
    console.error('Error updating interaction:', error);
    return false;
  }
};

/**
 * Updates bookmark for a menu item.
 *
 * @param menuItemApiId - The API ID of the menu item.
 * @param savedForLater - The saved for later status.
 * @returns Promise resolving to boolean indicating success.
 */
const updateBookmarkForMenuItem = async ({
  menuItemApiId,
  savedForLater,
}: {
  menuItemApiId: number;
  savedForLater: boolean;
}): Promise<boolean> => {
  try {
    const { status } = await updateUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      saved_for_later: savedForLater,
    });
    if (status !== 200) throw new Error('Failed to update interaction');
    return true;
  } catch (error) {
    console.error('Error updating interaction:', error);
    return false;
  }
};

/**
 * Favorite/Bookmark button props.
 *
 * @param icon - The icon to display.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @param title - The title of the interaction.
 * @param activeColor - The color of the active interaction.
 * @param activeBgColor - The background color of the active interaction.
 * @returns A React component.
 */
interface FavoriteBookmarkButtonProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  isActive: boolean;
  onClick: () => void;
  title: string;
  activeColor: string;
  activeBgColor: string;
}

/**
 * Favorite/Bookmark button component.
 *
 * @param icon - The icon to display.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @param title - The title of the interaction.
 * @param activeColor - The color of the active interaction.
 * @param activeBgColor - The background color of the active interaction.
 * @returns A React component.
 */
const FavoriteBookmarkButton = ({
  icon: Icon,
  isActive,
  onClick,
  title,
  activeColor,
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
      width={32}
      height={32}
      borderRadius={6}
      background={isActive ? activeBgColor : 'transparent'}
      title={title}
      transition='all 0.2s'
      hoverElevation={1}
    >
      <Icon size={18} color={isActive ? activeColor : theme.colors.gray800} />
    </Pane>
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
  const theme = useTheme();
  const [favorited, setFavorited] = useState<boolean>(menuItemInteraction.favorited || false);
  const [savedForLater, setSavedForLater] = useState<boolean>(
    menuItemInteraction.savedForLater || false
  );
  const [updating, setUpdating] = useState(false);

  // Handle when user clicks favorite button
  const handleFavoriteInteraction = async () => {
    if (updating) return;
    setUpdating(true);

    // Update favorited status and backup previous value
    const newFavoritedStatus = !favorited;
    const previousFavoritedBackup = favorited;
    setFavorited(newFavoritedStatus);

    // Update interaction in the API
    const updatedSuccessfully = await updateFavoriteForMenuItem({
      menuItemApiId,
      favorited: newFavoritedStatus,
    });
    if (!updatedSuccessfully) {
      setFavorited(previousFavoritedBackup);
    }
    setUpdating(false);
  };

  // Handle when user clicks bookmark button
  const handleBookmarkInteraction = async () => {
    if (updating) return;
    setUpdating(true);

    // Update saved for later status and backup previous value
    const newSavedForLaterStatus = !savedForLater;
    const previousSavedForLaterBackup = savedForLater;
    setSavedForLater(newSavedForLaterStatus);

    // Update interaction in the API
    const updatedSuccessfully = await updateBookmarkForMenuItem({
      menuItemApiId,
      savedForLater: newSavedForLaterStatus,
    });
    if (!updatedSuccessfully) {
      setSavedForLater(previousSavedForLaterBackup);
    }
    setUpdating(false);
  };

  // Render the favorite/bookmark buttons
  return (
    <Pane display='flex' alignItems='center' gap={majorScale(2)}>
      <FavoriteBookmarkButton
        icon={Heart}
        isActive={favorited}
        onClick={handleFavoriteInteraction}
        title='Favorite this item'
        activeColor={theme.colors.red700}
        activeBgColor={theme.colors.red100}
      />
      <FavoriteBookmarkButton
        icon={Bookmark}
        isActive={savedForLater}
        onClick={handleBookmarkInteraction}
        title='Save for later'
        activeColor={theme.colors.yellow800}
        activeBgColor={theme.colors.yellow100}
      />
    </Pane>
  );
}
