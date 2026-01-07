/**
 * @overview Column visibility dropdown component for hall menu modal.
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
import {
  Pane,
  Text,
  Button,
  Popover,
  Position,
  majorScale,
  minorScale,
  useTheme,
  ChevronDownIcon,
  Checkbox,
} from 'evergreen-ui';

export interface ColumnVisibility {
  calories: boolean;
  protein: boolean;
  sodium: boolean;
  fat: boolean;
  carbs: boolean;
  ingredients: boolean;
  allergens: boolean;
}

interface ColumnVisibilityDropdownProps {
  columnVisibility: ColumnVisibility;
  setColumnVisibility: (visibility: ColumnVisibility) => void;
}

/**
 * Column visibility dropdown component for hall menu modal.
 *
 * @param props - Component props
 * @returns The column visibility dropdown component
 */
export default function ColumnVisibilityDropdown({
  columnVisibility,
  setColumnVisibility,
}: ColumnVisibilityDropdownProps) {
  const theme = useTheme();

  const handleToggle = (column: keyof ColumnVisibility) => {
    setColumnVisibility({
      ...columnVisibility,
      [column]: !columnVisibility[column],
    });
  };

  const columns = [
    { key: 'calories' as const, label: 'Calories' },
    { key: 'protein' as const, label: 'Protein' },
    { key: 'sodium' as const, label: 'Sodium' },
    { key: 'fat' as const, label: 'Fat' },
    { key: 'carbs' as const, label: 'Carbs' },
    { key: 'ingredients' as const, label: 'Ingredients' },
    { key: 'allergens' as const, label: 'Allergens' },
  ];

  const checkedCount = Object.values(columnVisibility).filter(Boolean).length;

  return (
    <Pane display='flex' flexDirection='column' gap={minorScale(1)}>
      <Popover
        position={Position.BOTTOM_RIGHT}
        content={({ close }) => (
          <Pane
            background='white'
            borderRadius={8}
            boxShadow='0 4px 12px rgba(0,0,0,0.15)'
            padding={majorScale(2)}
            minWidth={200}
          >
            <Pane display='flex' flexDirection='column' gap={minorScale(2)}>
              {columns.map((column) => (
                <Checkbox
                  key={column.key}
                  checked={columnVisibility[column.key]}
                  onChange={() => handleToggle(column.key)}
                  label={column.label}
                />
              ))}
            </Pane>
          </Pane>
        )}
      >
        <Button
          appearance='minimal'
          width='100%'
          height={32}
          paddingX={majorScale(2)}
          paddingY={minorScale(2)}
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          textAlign='left'
          border={`1px solid ${theme.colors.border.default || theme.colors.gray300}`}
          borderRadius={4}
          background='white'
          fontSize={14}
          fontWeight={400}
          color={theme.colors.gray800}
          _hover={{
            background: theme.colors.gray50,
          }}
        >
          <Text>Columns ({checkedCount})</Text>
          <ChevronDownIcon size={16} />
        </Button>
      </Popover>
    </Pane>
  );
}
