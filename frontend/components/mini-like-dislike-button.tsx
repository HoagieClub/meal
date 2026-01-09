/**
 * @overview Mini like/dislike buttons component.
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

import React from 'react';
import { Pane, Text, useTheme, minorScale } from 'evergreen-ui';
import { MenuItem } from '@/types/dining';
import { useMenuItemLikeDislike } from '@/hooks/use-menu-item-like-dislike';

/**
 * Mini like/dislike buttons component.
 * Renders both like and dislike buttons that share the same state.
 *
 * @param item - The menu item to display like/dislike for.
 * @returns A React component.
 */
export const MiniLikeDislikeButtons = ({ item }: { item: MenuItem }) => {
  const theme = useTheme();

  // Get the like/dislike state and handlers from the useMenuItemLikeDislike hook
  const { userLiked, likeCount, dislikeCount, handleLike, handleDislike } = useMenuItemLikeDislike(
    item.apiId,
    item.userInteraction,
    item.metrics
  );

  // Render the mini like/dislike buttons
  return (
    <Pane display='flex' flexDirection='column' alignItems='center'>
      {/* Like button */}
      <Pane display='flex' alignItems='center' gap={minorScale(2)}>
        <Text size={300}>{likeCount}</Text>
        <Pane
          onClick={handleLike}
          cursor='pointer'
          padding={2}
          background={userLiked === true ? theme.colors.green100 : 'transparent'}
          borderRadius={999}
          title='Like this item'
          transition='all 0.2s'
          className='hover:opacity-80'
        >
          <Text fontSize={16} lineHeight={1}>
            👍
          </Text>
        </Pane>
      </Pane>

      {/* Dislike button */}
      <Pane display='flex' alignItems='center' gap={minorScale(2)}>
        <Text size={300}>{dislikeCount}</Text>
        <Pane
          onClick={handleDislike}
          cursor='pointer'
          padding={2}
          background={userLiked === false ? theme.colors.red100 : 'transparent'}
          borderRadius={999}
          title='Dislike this item'
          transition='all 0.2s'
          className='hover:opacity-80'
        >
          <Text fontSize={16} lineHeight={1}>
            👎
          </Text>
        </Pane>
      </Pane>
    </Pane>
  );
};
