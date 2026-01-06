/**
 * @overview Like/Dislike buttons component for nutrition page.
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

import React, { useEffect, useState, useRef } from 'react';
import { Pane, Text, useTheme, minorScale, majorScale, Spinner } from 'evergreen-ui';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { MenuItemInteraction, MenuItemMetrics } from '@/types/dining';
import {
  getUserMenuItemInteraction,
  updateUserMenuItemInteraction,
  getMenuItemMetrics,
} from '@/lib/next-endpoints';

/**
 * Updates interaction for a menu item.
 *
 * @param menuItemApiId - The API ID of the menu item.
 * @param liked - The liked status.
 * @returns Promise resolving to boolean indicating success.
 */
const updateInteractionForMenuItem = async (
  menuItemApiId: number,
  liked: boolean | null
): Promise<boolean> => {
  try {
    const { status } = await updateUserMenuItemInteraction({
      menu_item_api_id: menuItemApiId,
      liked: liked,
    });
    if (status !== 200) throw new Error('Failed to update interaction');
    return true;
  } catch (error) {
    console.error('Error updating interaction data:', error);
    return false;
  }
};

/**
 * Like/Dislike button props.
 *
 * @param icon - The icon to display.
 * @param count - The count of the interaction.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @param title - The title of the interaction.
 * @param activeColor - The color of the active interaction.
 * @param activeBgColor - The background color of the active interaction.
 * @returns A React component.
 */
interface LikeDislikeButtonProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  count: number | string;
  isActive: boolean;
  onClick: () => void;
  title: string;
  activeColor: string;
  activeBgColor: string;
}

/**
 * Like/Dislike button component.
 *
 * @returns A React component.
 */
const LikeDislikeButton = ({
  icon: Icon,
  count,
  isActive,
  onClick,
  title,
  activeColor,
  activeBgColor,
}: LikeDislikeButtonProps) => {
  const theme = useTheme();

  return (
    <Pane display='flex' alignItems='center' gap={minorScale(1)}>
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
      <Text size={300} fontWeight={500} color={isActive ? activeColor : theme.colors.gray800}>
        {count}
      </Text>
    </Pane>
  );
};

/**
 * Like/Dislike buttons component.
 *
 * @param menuItemApiId - The API ID of the menu item.
 * @param menuItemInteraction - The interaction data for the menu item.
 * @param menuItemMetrics - The metrics data for the menu item.
 * @returns A React component.
 */
export default function LikeDislikeButtons({
  menuItemApiId,
  menuItemInteraction,
  menuItemMetrics,
}: {
  menuItemApiId: number;
  menuItemInteraction: MenuItemInteraction;
  menuItemMetrics: MenuItemMetrics;
}) {
  const theme = useTheme();
  const [userLiked, setUserLiked] = useState<boolean | null>(
    menuItemInteraction.liked ? true : menuItemInteraction.liked === false ? false : null
  );
  const [likeCount, setLikeCount] = useState<number>(menuItemMetrics.likeCount ?? 0);
  const [dislikeCount, setDislikeCount] = useState<number>(menuItemMetrics.dislikeCount ?? 0);
  const [updating, setUpdating] = useState(false);

  // Handle when user clicks like button
  const handleLikeInteraction = async () => {
    if (updating) return;
    setUpdating(true);

    let newLikeStatus;
    let optimisticLikeCount;
    let optimisticDislikeCount;

    // Update like status and optimistic counts
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

    // Backup previous values
    const previousLikedBackup = userLiked;
    const previousLikeCountBackup = likeCount;
    const previousDislikeCountBackup = dislikeCount;

    // Update state
    setUserLiked(newLikeStatus);
    setLikeCount(optimisticLikeCount);
    setDislikeCount(optimisticDislikeCount);

    // Update interaction in the API
    const updatedSuccessfully = await updateInteractionForMenuItem(menuItemApiId, newLikeStatus);
    if (!updatedSuccessfully) {
      // Rollback state if error occurs
      setUserLiked(previousLikedBackup);
      setLikeCount(previousLikeCountBackup);
      setDislikeCount(previousDislikeCountBackup);
    }
    setUpdating(false);
  };

  // Handle when user clicks dislike button
  const handleDislikeInteraction = async () => {
    if (updating) return;
    setUpdating(true);

    let newLikeStatus;
    let optimisticLikeCount;
    let optimisticDislikeCount;

    // Update like status and optimistic counts
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

    // Backup previous values
    const previousLikedBackup = userLiked;
    const previousLikeCountBackup = likeCount;
    const previousDislikeCountBackup = dislikeCount;

    // Update state
    setUserLiked(newLikeStatus);
    setLikeCount(optimisticLikeCount);
    setDislikeCount(optimisticDislikeCount);

    // Update interaction in the API
    const updatedSuccessfully = await updateInteractionForMenuItem(menuItemApiId, newLikeStatus);
    if (!updatedSuccessfully) {
      // Rollback state if error occurs
      setUserLiked(previousLikedBackup);
      setLikeCount(previousLikeCountBackup);
      setDislikeCount(previousDislikeCountBackup);
    }
    setUpdating(false);
  };

  // Render the like/dislike buttons
  return (
    <Pane display='flex' alignItems='center' gap={majorScale(2)}>
      <LikeDislikeButton
        icon={ThumbsUp}
        count={likeCount}
        isActive={userLiked === true}
        onClick={handleLikeInteraction}
        title='Like this item'
        activeColor={theme.colors.green700}
        activeBgColor={theme.colors.green200}
      />
      <LikeDislikeButton
        icon={ThumbsDown}
        count={dislikeCount}
        isActive={userLiked === false}
        onClick={handleDislikeInteraction}
        title='Dislike this item'
        activeColor={theme.colors.red700}
        activeBgColor={theme.colors.red100}
      />
    </Pane>
  );
}
