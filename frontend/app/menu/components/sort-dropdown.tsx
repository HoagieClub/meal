/**
 * @overview Sort dropdown component for menu sorting.
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
import { Select, Pane, Text, minorScale, useTheme } from 'evergreen-ui';

export type MenuSortOption = 'best' | 'most viewed' | 'most liked' | 'recommended';

interface SortDropdownProps {
  sortOption: MenuSortOption;
  setSortOption: (sort: MenuSortOption) => void;
  showLabel?: boolean;
}

/**
 * Sort dropdown component for menu sorting.
 *
 * @param props - Component props
 * @returns The sort dropdown component
 */
export default function SortDropdown({
  sortOption,
  setSortOption,
  showLabel = false,
}: SortDropdownProps) {
  const theme = useTheme();

  return (
    <Pane display='flex' flexDirection='column' gap={minorScale(1)}>
      {showLabel && (
        <Text size={300} fontWeight={600} color={theme.colors.gray800}>
          Sort Meals By
        </Text>
      )}
      <Select
        width='100%'
        value={sortOption}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setSortOption(e.target.value as MenuSortOption)
        }
      >
        <option value='best'>Best</option>
        <option value='most viewed'>Most viewed</option>
        <option value='most liked'>Most liked</option>
        <option value='recommended'>Recommended</option>
      </Select>
    </Pane>
  );
}
