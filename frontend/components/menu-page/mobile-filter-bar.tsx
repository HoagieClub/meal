'use client';

import React from 'react';
import { SearchInput, FilterListIcon, useTheme } from 'evergreen-ui';

const LOCATION_OPTIONS = [
  { type: 'residential' as const, activeIcon: '/images/icons/dhall-inactive.svg', inactiveIcon: '/images/icons/dhall-active.svg', width: 16, height: 14, label: 'Dining Halls' },
  { type: 'retail' as const, activeIcon: '/images/icons/retail-inactive.svg', inactiveIcon: '/images/icons/retail-active.svg', width: 11, height: 14, label: 'Retail Cafes' },
];

interface MobileFilterBarProps {
  locationType: 'residential' | 'retail';
  setLocationType: (type: 'residential' | 'retail') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
}

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
      {/* Single row: mini location icons + search input + filter icon */}
      <div className='relative flex items-center gap-2 px-4 pt-2'>
        {/* Mini location type toggle — icon-only pill slider */}
        <div className='relative flex rounded-full overflow-hidden bg-[#a3d4b8]'>
          <div
            className='absolute rounded-full transition-transform duration-300 ease-in-out'
            style={{
              top: 0, bottom: 0, width: '50%',
              background: theme.colors.green700,
              transform: `translateX(${locationType === 'retail' ? '100%' : '0%'})`,
            }}
          />
          {LOCATION_OPTIONS.map(({ type, activeIcon, inactiveIcon, width, height, label }) => {
            const isActive = locationType === type;
            return (
              <button
                key={type}
                onClick={() => setLocationType(type)}
                aria-label={label}
                className='relative z-10 flex items-center justify-center p-2'
              >
                <div className='relative' style={{ width, height }}>
                  <img src={inactiveIcon} alt='' width={width} height={height} className='absolute inset-0  transition-opacity duration-300' style={{ opacity: isActive ? 0 : 1 }} />
                  <img src={activeIcon} alt='' width={width} height={height} className='absolute inset-0 -pl-[1px] transition-opacity duration-300' style={{ opacity: isActive ? 1 : 0 }} />
                </div>
              </button>
            );
          })}
        </div>
        <div className='flex-1'>
          <SearchInput
            placeholder='Search for food...'
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            width='100%'
          />
        </div>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className='flex items-center justify-center p-2 rounded-xl transition-colors duration-200 active:bg-black/10'
          aria-label='Toggle filters'
        >
          <FilterListIcon
            size={20}
            color={theme.colors.green700}
          />
        </button>

      </div>
    </div>
  );
}
