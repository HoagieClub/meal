/**
 * @overview Custom hook for managing menu item favorite/bookmark interactions.
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

import { useState } from 'react';
import { MenuItemInteraction } from '@/types/types';
import { patchUserMenuItemInteraction } from '@/lib/next-endpoints';

/**
 * Hook return type for useMenuItemFavoriteBookmark.
 *
 * @param favorited - The user's favorited status.
 * @param savedForLater - The user's saved for later status.
 * @param updating - Whether an update is in progress.
 * @param handleFavorite - The function to handle favorite button click.
 * @param handleBookmark - The function to handle bookmark button click.
 */
export interface UseMenuItemFavoriteBookmarkReturn {
  favorited: boolean;
  savedForLater: boolean;
  updating: boolean;
  handleFavorite: () => void;
  handleBookmark: () => void;
}

/**
 * Custom hook for managing menu item favorite/bookmark interactions.
 *
 * @param menuItemApiId - The API ID of the menu item.
 * @param initialInteraction - Initial interaction data for the menu item (optional).
 * @returns Object containing state and handlers for favorite/bookmark interactions.
 */
export const useMenuItemFavoriteBookmark = (
  menuItemApiId: string,
  initialInteraction?: MenuItemInteraction | null
): UseMenuItemFavoriteBookmarkReturn => {
  const [favorited, setFavorited] = useState<boolean>(initialInteraction?.favorited || false);
  const [savedForLater, setSavedForLater] = useState<boolean>(
    initialInteraction?.savedForLater || false
  );
  const [updating, setUpdating] = useState(false);

  /**
   * Handles when user clicks favorite button.
   */
  const handleFavorite = async () => {
    if (updating) return;
    setUpdating(true);

    // Update favorited status and backup previous value
    const newFavoritedStatus = !favorited;
    const previousFavoritedBackup = favorited;

    // Optimistically update state
    setFavorited(newFavoritedStatus);

    // Update interaction in the API
    const updatedSuccessfully = await patchUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      favorited: newFavoritedStatus,
    });
    if (updatedSuccessfully.status !== 200) {
      // Rollback state if error occurs
      setFavorited(previousFavoritedBackup);
    }
    setUpdating(false);
  };

  /**
   * Handles when user clicks bookmark button.
   */
  const handleBookmark = async () => {
    if (updating) return;
    setUpdating(true);

    // Update saved for later status and backup previous value
    const newSavedForLaterStatus = !savedForLater;
    const previousSavedForLaterBackup = savedForLater;

    // Optimistically update state
    setSavedForLater(newSavedForLaterStatus);

    // Update interaction in the API
    const updatedSuccessfully = await patchUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      saved_for_later: newSavedForLaterStatus,
    });
    if (updatedSuccessfully.status !== 200) {
      // Rollback state if error occurs
      setSavedForLater(previousSavedForLaterBackup);
    }
    setUpdating(false);
  };

  return {
    favorited,
    savedForLater,
    updating,
    handleFavorite,
    handleBookmark,
  };
};
