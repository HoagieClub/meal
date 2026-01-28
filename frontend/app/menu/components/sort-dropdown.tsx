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
import { MENU_SORT_OPTIONS, MenuSortOption } from '@/types/types';

/**
 * Sort dropdown component for menu sorting.
 *
 * @param sortOption - The sort option.
 * @param setSortOption - The function to set the sort option.
 * @param showLabel - Whether to show the label.
 * @returns The sort dropdown component
 */
export default function SortDropdown({
  sortOption,
  setSortOption,
  showLabel = false,
}: {
  sortOption: MenuSortOption;
  setSortOption: (sort: MenuSortOption) => void;
  showLabel?: boolean;
}) {
  const theme = useTheme();

  // Render the sort dropdown.
  return (
    <Pane display='flex' flexDirection='column' gap={minorScale(1)}>
      {/* Render the label if showLabel is true. */}
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
        {MENU_SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </Pane>
  );
}
