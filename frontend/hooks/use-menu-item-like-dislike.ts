/**
 * @overview Custom hook for managing menu item like/dislike interactions.
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
import { MenuItemInteraction, MenuItemMetrics } from '@/types/dining';
import { updateUserMenuItemInteraction } from '@/lib/next-endpoints';

/**
 * Hook return type for useMenuItemLikeDislike.
 *
 * @param userLiked - The user's liked status.
 * @param likeCount - The like count.
 * @param dislikeCount - The dislike count.
 * @param updating - Whether an update is in progress.
 * @param handleLike - The function to handle like button click.
 * @param handleDislike - The function to handle dislike button click.
 */
export interface UseMenuItemLikeDislikeReturn {
  userLiked: boolean | null;
  likeCount: number;
  dislikeCount: number;
  updating: boolean;
  handleLike: () => void;
  handleDislike: () => void;
}

/**
 * Custom hook for managing menu item like/dislike interactions.
 *
 * @param menuItemApiId - The API ID of the menu item.
 * @param initialInteraction - Initial interaction data for the menu item (optional).
 * @param initialMetrics - Initial metrics data for the menu item (optional).
 * @returns Object containing state and handlers for like/dislike interactions.
 */
export const useMenuItemLikeDislike = (
  menuItemApiId: number,
  initialInteraction?: MenuItemInteraction | null,
  initialMetrics?: MenuItemMetrics | null
): UseMenuItemLikeDislikeReturn => {
  const [userLiked, setUserLiked] = useState<boolean | null>(
    initialInteraction?.liked ? true : initialInteraction?.liked === false ? false : null
  );
  const [likeCount, setLikeCount] = useState<number>(initialMetrics?.likeCount ?? 0);
  const [dislikeCount, setDislikeCount] = useState<number>(initialMetrics?.dislikeCount ?? 0);
  const [updating, setUpdating] = useState(false);

  /**
   * Handles when user clicks like button.
   */
  const handleLike = async () => {
    if (updating) return;
    setUpdating(true);

    let newLikeStatus: boolean | null;
    let optimisticLikeCount: number;
    let optimisticDislikeCount: number;

    // Update like status and optimistic counts
    if (userLiked === true) {
      // Already liked, remove like
      newLikeStatus = null;
      optimisticLikeCount = likeCount - 1;
      optimisticDislikeCount = dislikeCount;
    } else if (userLiked === false) {
      // Currently disliked, switch to liked
      newLikeStatus = true;
      optimisticLikeCount = likeCount + 1;
      optimisticDislikeCount = dislikeCount - 1;
    } else {
      // Neutral, add like
      newLikeStatus = true;
      optimisticLikeCount = likeCount + 1;
      optimisticDislikeCount = dislikeCount;
    }

    // Backup previous values for rollback
    const previousLikedBackup = userLiked;
    const previousLikeCountBackup = likeCount;
    const previousDislikeCountBackup = dislikeCount;

    // Optimistically update state
    setUserLiked(newLikeStatus);
    setLikeCount(optimisticLikeCount);
    setDislikeCount(optimisticDislikeCount);

    // Update interaction in the API
    const updatedSuccessfully = await updateUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      liked: newLikeStatus,
    });
    if (updatedSuccessfully.status !== 200) {
      // Rollback state if error occurs
      setUserLiked(previousLikedBackup);
      setLikeCount(previousLikeCountBackup);
      setDislikeCount(previousDislikeCountBackup);
    }
    setUpdating(false);
  };

  /**
   * Handles when user clicks dislike button.
   */
  const handleDislike = async () => {
    if (updating) return;
    setUpdating(true);

    let newLikeStatus: boolean | null;
    let optimisticLikeCount: number;
    let optimisticDislikeCount: number;

    // Update like status and optimistic counts
    if (userLiked === false) {
      // Already disliked, remove dislike
      newLikeStatus = null;
      optimisticLikeCount = likeCount;
      optimisticDislikeCount = dislikeCount - 1;
    } else if (userLiked === true) {
      // Currently liked, switch to disliked
      newLikeStatus = false;
      optimisticLikeCount = likeCount - 1;
      optimisticDislikeCount = dislikeCount + 1;
    } else {
      // Neutral, add dislike
      newLikeStatus = false;
      optimisticLikeCount = likeCount;
      optimisticDislikeCount = dislikeCount + 1;
    }

    // Backup previous values for rollback
    const previousLikedBackup = userLiked;
    const previousLikeCountBackup = likeCount;
    const previousDislikeCountBackup = dislikeCount;

    // Optimistically update state
    setUserLiked(newLikeStatus);
    setLikeCount(optimisticLikeCount);
    setDislikeCount(optimisticDislikeCount);

    // Update interaction in the API
    const updatedSuccessfully = await updateUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      liked: newLikeStatus,
    });
    if (updatedSuccessfully.status !== 200) {
      // Rollback state if error occurs
      setUserLiked(previousLikedBackup);
      setLikeCount(previousLikeCountBackup);
      setDislikeCount(previousDislikeCountBackup);
    }
    setUpdating(false);
  };

  return {
    userLiked,
    likeCount,
    dislikeCount,
    updating,
    handleLike,
    handleDislike,
  };
};
