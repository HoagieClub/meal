/**
 * @overview Custom hook for managing menu item interactions (like/dislike and favorite).
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
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { MenuItemInteraction, MenuItemMetrics } from '@/types/types';
import { patchUserMenuItemInteraction } from '@/lib/next-endpoints';
import { useInteractionsContext } from '@/contexts/interactions-context';

/**
 * Hook return type for useMenuItemInteractions.
 */
export interface UseMenuItemInteractions {
  userLiked: boolean | null;
  likeCount: number;
  dislikeCount: number;
  favorited: boolean;
  updating: boolean;
  handleLike: () => void;
  handleDislike: () => void;
  handleFavorite: () => void;
}

/**
 * Custom hook for managing menu item interactions (like/dislike and favorite).
 *
 * @param menuItemApiId - The API ID of the menu item.
 * @param initialInteraction - Initial interaction data for the menu item (optional).
 * @param initialMetrics - Initial metrics data for the menu item (optional).
 * @returns Object containing state and handlers for interactions.
 */
export const useMenuItemInteractions = (
  menuItemApiId: string,
  initialInteraction?: MenuItemInteraction | null,
  initialMetrics?: MenuItemMetrics | null
): UseMenuItemInteractions => {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const { interactions, metrics, updateInteraction, updateMetrics } = useInteractionsContext();

  const contextInteraction = interactions[menuItemApiId];
  const contextMetrics = metrics[menuItemApiId];

  // Prefer context values (live-updated), fall back to initial props
  const userLiked: boolean | null = contextInteraction?.liked !== undefined
    ? (contextInteraction.liked ?? null)
    : (initialInteraction?.liked ? true : initialInteraction?.liked === false ? false : null);
  const likeCount = contextMetrics?.likeCount ?? initialMetrics?.likeCount ?? 0;
  const dislikeCount = contextMetrics?.dislikeCount ?? initialMetrics?.dislikeCount ?? 0;
  const favorited = contextInteraction?.favorited !== undefined
    ? contextInteraction.favorited
    : (initialInteraction?.favorited || false);

  const setUserLiked = (val: boolean | null) => updateInteraction(menuItemApiId, { liked: val });
  const setLikeCount = (val: number) => updateMetrics(menuItemApiId, { likeCount: val });
  const setDislikeCount = (val: number) => updateMetrics(menuItemApiId, { dislikeCount: val });
  const setFavorited = (val: boolean) => updateInteraction(menuItemApiId, { favorited: val });

  const [updating, setUpdating] = useState(false);

  /**
   * Handles when user clicks like button.
   */
  const handleLike = async () => {
    if (!userLoading && !user) {
      const currentPath =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/menu';
      router.push(`/api/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (updating) return;
    setUpdating(true);

    let newLikeStatus: boolean | null;
    let optimisticLikeCount: number;
    let optimisticDislikeCount: number;

    if (userLiked === true) {
      newLikeStatus = null;
      optimisticLikeCount = likeCount - 1;
      optimisticDislikeCount = dislikeCount;
    } else if (userLiked === false) {
      newLikeStatus = true;
      optimisticLikeCount = likeCount + 1;
      optimisticDislikeCount = dislikeCount - 1;
    } else {
      newLikeStatus = true;
      optimisticLikeCount = likeCount + 1;
      optimisticDislikeCount = dislikeCount;
    }

    const previousLikedBackup = userLiked;
    const previousLikeCountBackup = likeCount;
    const previousDislikeCountBackup = dislikeCount;

    setUserLiked(newLikeStatus);
    setLikeCount(optimisticLikeCount);
    setDislikeCount(optimisticDislikeCount);

    const updatedSuccessfully = await patchUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      liked: newLikeStatus,
    });
    if (updatedSuccessfully.status !== 200) {
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
    if (!userLoading && !user) {
      const currentPath =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/menu';
      router.push(`/api/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (updating) return;
    setUpdating(true);

    let newLikeStatus: boolean | null;
    let optimisticLikeCount: number;
    let optimisticDislikeCount: number;

    if (userLiked === false) {
      newLikeStatus = null;
      optimisticLikeCount = likeCount;
      optimisticDislikeCount = dislikeCount - 1;
    } else if (userLiked === true) {
      newLikeStatus = false;
      optimisticLikeCount = likeCount - 1;
      optimisticDislikeCount = dislikeCount + 1;
    } else {
      newLikeStatus = false;
      optimisticLikeCount = likeCount;
      optimisticDislikeCount = dislikeCount + 1;
    }

    const previousLikedBackup = userLiked;
    const previousLikeCountBackup = likeCount;
    const previousDislikeCountBackup = dislikeCount;

    setUserLiked(newLikeStatus);
    setLikeCount(optimisticLikeCount);
    setDislikeCount(optimisticDislikeCount);

    const updatedSuccessfully = await patchUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      liked: newLikeStatus,
    });
    if (updatedSuccessfully.status !== 200) {
      setUserLiked(previousLikedBackup);
      setLikeCount(previousLikeCountBackup);
      setDislikeCount(previousDislikeCountBackup);
    }
    setUpdating(false);
  };

  /**
   * Handles when user clicks favorite button.
   */
  const handleFavorite = async () => {
    if (!userLoading && !user) {
      const currentPath =
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/menu';
      router.push(`/api/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (updating) return;
    setUpdating(true);

    const newFavoritedStatus = !favorited;
    const previousFavoritedBackup = favorited;

    setFavorited(newFavoritedStatus);

    const updatedSuccessfully = await patchUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      favorited: newFavoritedStatus,
    });
    if (updatedSuccessfully.status !== 200) {
      setFavorited(previousFavoritedBackup);
    }
    setUpdating(false);
  };

  return {
    userLiked,
    likeCount,
    dislikeCount,
    favorited,
    updating,
    handleLike,
    handleDislike,
    handleFavorite,
  };
};

