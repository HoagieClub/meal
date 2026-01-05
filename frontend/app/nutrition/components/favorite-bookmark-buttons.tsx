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
import { MenuItemInteraction } from '@/types/dining';
import { getUserMenuItemInteraction, updateUserMenuItemInteraction } from '@/lib/next-endpoints';

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
 * @returns A React component.
 */
export default function FavoriteBookmarkButtons({ menuItemApiId }: { menuItemApiId: number }) {
  const theme = useTheme();
  const [favorited, setFavorited] = useState<boolean>(false);
  const [savedForLater, setSavedForLater] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch interaction from the API
  const fetchInteraction = async () => {
    setLoading(true);
    try {
      const interactionRes = await getUserMenuItemInteraction({
        menu_item_api_id: menuItemApiId,
      }).catch(() => null);

      if (interactionRes?.data?.data) {
        setFavorited(interactionRes.data.data.favorited || false);
        setSavedForLater(interactionRes.data.data.savedForLater || false);
      }
    } catch (error) {
      console.error('Error fetching interaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch interaction when the component mounts
  useEffect(() => {
    if (menuItemApiId) {
      fetchInteraction();
    }
  }, [menuItemApiId]);

  // Handle when user clicks favorite button
  const handleFavoriteInteraction = async () => {
    if (updating) return;
    setUpdating(true);

    const newFavoritedStatus = !favorited;

    // Backup previous value
    const previousFavoritedBackup = favorited;

    // Update state
    setFavorited(newFavoritedStatus);

    // Update interaction in the API
    try {
      const { data, error } = await updateUserMenuItemInteraction({
        menu_item_api_id: menuItemApiId,
        favorited: newFavoritedStatus,
      });
      if (error) throw new Error(error);
    } catch (error) {
      // Rollback state if error occurs
      console.error('Error updating favorite interaction:', error);
      setFavorited(previousFavoritedBackup);
    } finally {
      setUpdating(false);
    }
  };

  // Handle when user clicks bookmark button
  const handleBookmarkInteraction = async () => {
    if (updating) return;
    setUpdating(true);

    const newSavedForLaterStatus = !savedForLater;

    // Backup previous value
    const previousSavedForLaterBackup = savedForLater;

    // Update state
    setSavedForLater(newSavedForLaterStatus);

    // Update interaction in the API
    try {
      const { data, error } = await updateUserMenuItemInteraction({
        menu_item_api_id: menuItemApiId,
        saved_for_later: newSavedForLaterStatus,
      });
      if (error) throw new Error(error);
    } catch (error) {
      // Rollback state if error occurs
      console.error('Error updating bookmark interaction:', error);
      setSavedForLater(previousSavedForLaterBackup);
    } finally {
      setUpdating(false);
    }
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
