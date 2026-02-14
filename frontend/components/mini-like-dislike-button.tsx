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
import Image from 'next/image';
import { Pane, Text, useTheme, minorScale } from 'evergreen-ui';
import { MenuItem } from '@/types/types';
import { useMenuItemInteractions } from '@/hooks/use-menu-item-interactions';

/**
 * Mini like/dislike buttons component.
 * Renders both like and dislike buttons that share the same state.
 *
 * @param item - The menu item to display like/dislike for.
 * @returns A React component.
 */
export const MiniLikeDislikeButtons = ({ item }: { item: MenuItem }) => {
  const theme = useTheme();

  // Get the like/dislike state and handlers from the useMenuItemInteractions hook
  const { userLiked, likeCount, dislikeCount, handleLike, handleDislike } = useMenuItemInteractions(
    item.apiId,
    item.userInteraction,
    item.metrics
  );

  // Render the mini like/dislike buttons (YouTube-style pill)
  return (
    <Pane
      display='flex'
      alignItems='center'
      borderRadius={999}
      overflow='hidden'
    >
      {/* Like button */}
      <Pane
        display='flex'
        alignItems='center'
        justifyContent='center'
        gap={minorScale(1)}
        onClick={handleLike}
        cursor='pointer'
        minWidth={40}
        paddingX={minorScale(2)}
        paddingY={minorScale(1)}
        className={"hover:bg-green-50" + (userLiked === true ? " bg-green-50" : " transparent")}
        title='Like this item'
        transition='all 0.2s'
      >
        <Pane position="relative" width={12} height={12}>
          <Image
            src='/images/icons/like.svg'
            alt='Like'
            width={12}
            height={12}
            style={{
              position: 'absolute',
              opacity: userLiked === true ? 0 : 1,
              transition: 'all 0.2s'
            }}
          />
          <Image
            src='/images/icons/like-solid.svg'
            alt='Like'
            width={12}
            height={12}
            style={{
              opacity: userLiked === true ? 1 : 0,
              transition: 'all 0.2s'
            }}
          />
        </Pane>
        <Text size={300} fontWeight={500}>
          {likeCount}
        </Text>
      </Pane>

      <Pane width={1} alignSelf='stretch' background={theme.colors.gray500} />

      {/* Dislike button */}
      <Pane
        display='flex'
        alignItems='center'
        justifyContent='center'
        gap={minorScale(1)}
        onClick={handleDislike}
        cursor='pointer'
        minWidth={40}
        paddingX={minorScale(2)}
        paddingY={minorScale(1)}
        className={"hover:bg-red-50" + (userLiked === false ? " bg-red-50" : " transparent")}
        title='Dislike this item'
        transition='all 0.2s'
      >
        <Pane position="relative" width={12} height={12}>
          <Image
            src='/images/icons/dislike.svg'
            alt='Dislike'
            width={12}
            height={12}
            style={{
              position: 'absolute',
              opacity: userLiked === false ? 0 : 1,
              transition: 'all 0.2s ease-in-out'
            }}
          />
          <Image
            src='/images/icons/dislike-solid.svg'
            alt='Dislike'
            width={12}
            height={12}
            style={{
              opacity: userLiked === false ? 1 : 0,
              transition: 'all 0.2s ease-in-out'
            }}
          />
        </Pane>
        <Text size={300} fontWeight={500}>
          {dislikeCount}
        </Text>
      </Pane>
    </Pane>
  );
};
