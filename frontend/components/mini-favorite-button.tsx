/**
 * @overview Mini favorite button component.
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
import Image from 'next/image';
import { Pane, minorScale } from 'evergreen-ui';
import { MenuItem } from '@/types/types';
import { useMenuItemInteractions } from '@/hooks/use-menu-item-interactions';

/**
 * Mini favorite button component.
 * Renders a heart icon that toggles favorite state.
 *
 * @param item - The menu item to display favorite for.
 * @returns A React component.
 */
export const MiniFavoriteButton = ({ item }: { item: MenuItem }) => {
  const { favorited, handleFavorite } = useMenuItemInteractions(
    item.apiId,
    item.userInteraction,
    item.metrics
  );

  return (
    <Pane
      display='flex'
      alignItems='center'
      justifyContent='center'
      onClick={handleFavorite}
      cursor='pointer'
      paddingX={minorScale(1)}
      paddingY={minorScale(1)}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      transition='all 0.15s ease-out'
      className='hover:opacity-70 active:scale-90'
    >
      <Pane position='relative' width={14} height={14}>
        <Image
          src='/images/icons/heart.svg'
          alt='Favorite'
          width={14}
          height={14}
          style={{
            position: 'absolute',
            opacity: favorited ? 0 : 1,
            transition: 'all 0.2s',
          }}
        />
        <Image
          src='/images/icons/heart-solid.svg'
          alt='Favorited'
          width={14}
          height={14}
          style={{
            opacity: favorited ? 1 : 0,
            transition: 'all 0.2s',
          }}
        />
      </Pane>
    </Pane>
  );
};
