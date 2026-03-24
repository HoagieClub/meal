'use client';

import React from 'react';
import Image from 'next/image';
import { Pane, minorScale } from 'evergreen-ui';
/**
 * Favorite button component.
 * Renders a star icon that toggles favorite state.
 *
 * @returns A React component.
 */
export const FavoriteButton = ({ favorited, onToggle }: { favorited: boolean; onToggle: () => void }) => {
  return (
    <Pane
      display='flex'
      alignItems='center'
      justifyContent='center'
      onClick={onToggle}
      cursor='pointer'
      paddingX={minorScale(1)}
      paddingY={minorScale(1)}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      transition='all 0.15s ease-out'
      className='hover:opacity-70 active:scale-90'
    >
      <Pane position='relative' width={14} height={14}>
        {/* make heart red if favorited */}
        <Image
          src='/images/icons/star.svg'
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
          src='/images/icons/star-filled.svg'
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
