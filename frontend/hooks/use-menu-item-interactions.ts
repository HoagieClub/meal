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
import { useUser } from '@auth0/nextjs-auth0/client';
import { MenuItemInteraction, MenuItemMetrics } from '@/types/types';
import { patchUserMenuItemInteraction } from '@/lib/endpoints';

// Module-level interaction store — persists across renders, clears on page reload
export const localInteractions = new Map<string, { liked?: boolean | null; favorited?: boolean }>();

// Listener for triggering re-renders in MenuPage when the Map updates
let onInteractionChange: (() => void) | null = null;
export function setInteractionListener(cb: () => void) { onInteractionChange = cb; }

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

export const useMenuItemInteractions = (
  menuItemApiId: string,
  initialInteraction?: MenuItemInteraction | null,
  initialMetrics?: MenuItemMetrics | null
): UseMenuItemInteractions => {
  const { user, isLoading: userLoading } = useUser();

  // Merge: local overrides win over API data
  const local = localInteractions.get(menuItemApiId);

  const userLiked: boolean | null = local?.liked !== undefined
    ? local.liked
    : initialInteraction?.liked === true
      ? true
      : initialInteraction?.liked === false
        ? false
        : null;

  const favorited = local?.favorited !== undefined
    ? local.favorited
    : (initialInteraction?.favorited || false);

  // Adjust counts based on local overrides vs API data
  const apiLiked = initialInteraction?.liked === true ? true : initialInteraction?.liked === false ? false : null;
  let likeCount = initialMetrics?.likeCount ?? 0;
  let dislikeCount = initialMetrics?.dislikeCount ?? 0;

  if (local?.liked !== undefined && local.liked !== apiLiked) {
    // User changed their like state locally
    if (apiLiked === true && local.liked !== true) likeCount--;
    if (apiLiked === false && local.liked !== false) dislikeCount--;
    if (local.liked === true && apiLiked !== true) likeCount++;
    if (local.liked === false && apiLiked !== false) dislikeCount++;
  }

  const [updating, setUpdating] = useState(false);

  const redirectToLogin = () => {
    const currentPath =
      typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(currentPath)}`;
  };

  const handleLike = async () => {
    if (!userLoading && !user) { redirectToLogin(); return; }
    if (updating) return;
    setUpdating(true);
    const newLikeStatus = userLiked === true ? null : true;
    const existing = localInteractions.get(menuItemApiId) || {};
    localInteractions.set(menuItemApiId, { ...existing, liked: newLikeStatus });
    onInteractionChange?.();
    await patchUserMenuItemInteraction({ menu_item_api_id: menuItemApiId, liked: newLikeStatus });
    setUpdating(false);
  };

  const handleDislike = async () => {
    if (!userLoading && !user) { redirectToLogin(); return; }
    if (updating) return;
    setUpdating(true);
    const newLikeStatus = userLiked === false ? null : false;
    const existing = localInteractions.get(menuItemApiId) || {};
    localInteractions.set(menuItemApiId, { ...existing, liked: newLikeStatus });
    onInteractionChange?.();
    await patchUserMenuItemInteraction({ menu_item_api_id: menuItemApiId, liked: newLikeStatus });
    setUpdating(false);
  };

  const handleFavorite = async () => {
    if (!userLoading && !user) { redirectToLogin(); return; }
    if (updating) return;
    setUpdating(true);
    const newFavorited = !favorited;
    const existing = localInteractions.get(menuItemApiId) || {};
    localInteractions.set(menuItemApiId, { ...existing, favorited: newFavorited });
    onInteractionChange?.();
    await patchUserMenuItemInteraction({ menu_item_api_id: menuItemApiId, favorited: newFavorited });
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
