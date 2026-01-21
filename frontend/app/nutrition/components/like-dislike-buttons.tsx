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

import React from 'react';
import { Pane, Text, useTheme, minorScale, majorScale } from 'evergreen-ui';
import { MenuItemInteraction, MenuItemMetrics } from '@/types/types';
import { useMenuItemLikeDislike } from '@/hooks/use-menu-item-like-dislike';

/**
 * Like/Dislike button props.
 *
 * @param emoji - The emoji to display.
 * @param count - The count of the interaction.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @param title - The title of the interaction.
 * @param activeColor - The color of the active interaction.
 * @param activeBgColor - The background color of the active interaction.
 * @returns A React component.
 */
interface LikeDislikeButtonProps {
  emoji: string;
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
 * @param props - The props for the LikeDislikeButton component.
 * @returns A React component.
 */
const LikeDislikeButton = ({
  emoji,
  count,
  isActive,
  onClick,
  title,
  activeColor,
  activeBgColor,
}: LikeDislikeButtonProps) => {
  return (
    <Pane display='flex' alignItems='center' gap={minorScale(1)}>
      <Pane
        padding={2}
        borderRadius={999}
        onClick={onClick}
        cursor='pointer'
        title={title}
        background={isActive ? activeBgColor : 'transparent'}
        display='flex'
        alignItems='center'
        justifyContent='center'
        transition='all 0.2s'
        className='hover:opacity-80'
        width={32}
        height={32}
      >
        <Text fontSize={18} lineHeight={1}>
          {emoji}
        </Text>
      </Pane>
      <Text size={400} fontWeight={600} color={isActive ? activeColor : 'black'}>
        {count}
      </Text>
    </Pane>
  );
};

/**
 * Like button component.
 *
 * @param count - The count of the interaction.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @returns A React component.
 */
const LikeButton = ({
  count,
  isActive,
  onClick,
}: {
  count: number;
  isActive: boolean;
  onClick: () => void;
}) => {
  const theme = useTheme();
  return (
    <LikeDislikeButton
      emoji='👍'
      count={count}
      isActive={isActive}
      onClick={onClick}
      title='Like this item'
      activeColor={theme.colors.green700}
      activeBgColor={theme.colors.green200}
    />
  );
};

/**
 * Dislike button component.
 *
 * @param count - The count of the interaction.
 * @param isActive - Whether the interaction is active.
 * @param onClick - The function to call when the interaction is clicked.
 * @returns A React component.
 */
const DislikeButton = ({
  count,
  isActive,
  onClick,
}: {
  count: number;
  isActive: boolean;
  onClick: () => void;
}) => {
  const theme = useTheme();
  return (
    <LikeDislikeButton
      emoji='👎'
      count={count}
      isActive={isActive}
      onClick={onClick}
      title='Dislike this item'
      activeColor={theme.colors.red700}
      activeBgColor={theme.colors.red100}
    />
  );
};

export default function LikeDislikeButtons({
  menuItemApiId,
  menuItemInteraction,
  menuItemMetrics,
}: {
  menuItemApiId: string;
  menuItemInteraction: MenuItemInteraction;
  menuItemMetrics: MenuItemMetrics;
}) {
  // Get the like and dislike state and handlers.
  const { userLiked, likeCount, dislikeCount, handleLike, handleDislike } = useMenuItemLikeDislike(
    menuItemApiId,
    menuItemInteraction,
    menuItemMetrics
  );

  // Render the like/dislike buttons
  return (
    <Pane display='flex' alignItems='center' gap={majorScale(1)}>
      <LikeButton count={likeCount} isActive={userLiked === true} onClick={handleLike} />
      <DislikeButton count={dislikeCount} isActive={userLiked === false} onClick={handleDislike} />
    </Pane>
  );
}
