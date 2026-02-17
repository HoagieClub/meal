'use client';

import React from 'react';
import Image from 'next/image';
import { Pane, minorScale } from 'evergreen-ui';
import { useMenuItemInteractions } from '@/hooks/use-menu-item-interactions';

/**
 * Favorite button component.
 * Renders a heart icon that toggles favorite state.
 *
 * @param item - The menu item to display favorite for.
 * @returns A React component.
 */
export const FavoriteButton = ({ item }: { item: any }) => {
  const { favorited, handleFavorite } = useMenuItemInteractions(
    item.id,
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
