'use client';

import type { ChangeEvent } from 'react';
import { FilterListIcon, SearchInput, useTheme } from 'evergreen-ui';
import { LOCATION_TYPE_OPTIONS } from '@/lib/constants';
import type { LocationType } from '@/types';

interface MobileFilterBarProps {
  locationType: LocationType;
  setLocationType: (type: LocationType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
}

const ICON_SIZES: Record<LocationType, { width: number; height: number }> = {
  residential: { width: 16, height: 14 },
  retail: { width: 11, height: 14 },
};

/** Sticky mobile header: icon-only location toggle, search box and filter button. */
export default function MobileFilterBar({
  locationType,
  setLocationType,
  searchTerm,
  setSearchTerm,
  filterOpen,
  setFilterOpen,
}: MobileFilterBarProps) {
  const theme = useTheme();

  return (
    <div className='pb-2'>
      <div className='relative flex items-center gap-2 px-4 pt-2'>
        <div className='relative flex overflow-hidden rounded-full bg-[#a3d4b8]'>
          <div
            className='absolute rounded-full transition-transform duration-300 ease-in-out'
            style={{
              top: 0,
              bottom: 0,
              width: '50%',
              background: theme.colors.green700,
              transform: `translateX(${locationType === 'retail' ? '100%' : '0%'})`,
            }}
          />
          {LOCATION_TYPE_OPTIONS.map(({ type, label, lightIcon, darkIcon }) => {
            const active = locationType === type;
            const { width, height } = ICON_SIZES[type];
            return (
              <button
                key={type}
                type='button'
                onClick={() => setLocationType(type)}
                aria-label={label}
                aria-pressed={active}
                className='relative z-10 flex items-center justify-center p-2'
              >
                <div className='relative' style={{ width, height }}>
                  <img
                    src={darkIcon}
                    alt=''
                    width={width}
                    height={height}
                    className='absolute inset-0 transition-opacity duration-300'
                    style={{ opacity: active ? 0 : 1 }}
                  />
                  <img
                    src={lightIcon}
                    alt=''
                    width={width}
                    height={height}
                    className='absolute inset-0 transition-opacity duration-300'
                    style={{ opacity: active ? 1 : 0 }}
                  />
                </div>
              </button>
            );
          })}
        </div>
        <div className='flex-1 [&_input]:rounded-full'>
          <SearchInput
            placeholder='Search for food...'
            aria-label='Search for food'
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            width='100%'
            height={36}
            autoComplete='off'
            spellCheck={false}
          />
        </div>
        <button
          type='button'
          onClick={() => setFilterOpen(!filterOpen)}
          className='flex items-center justify-center rounded-xl p-2 transition-colors duration-200 active:bg-black/10'
          aria-label='Toggle filters'
          aria-expanded={filterOpen}
        >
          <FilterListIcon size={20} color={theme.colors.green700} />
        </button>
      </div>
    </div>
  );
}
