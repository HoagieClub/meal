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
import { COLUMNS } from '@/types/types';

/**
 * Column visibility dropdown component for hall menu modal.
 *
 * @param toggledColumns - The columns to display
 * @param setToggledColumns - The function to set the columns to display
 * @returns The column visibility dropdown component
 */
export default function ColumnVisibilityDropdown({
  toggledColumns,
  setToggledColumns,
}: {
  toggledColumns: Column[];
  setToggledColumns: React.Dispatch<React.SetStateAction<Column[]>>;
}) {
  const theme = useTheme();

  // Render the column visibility dropdown.
  return (
    <Pane display='flex' flexDirection='column' gap={minorScale(1)}>
      <Popover
        position={Position.BOTTOM_RIGHT}
        content={() => (
          <Pane
            background='white'
            borderRadius={8}
            boxShadow='0 4px 12px rgba(0,0,0,0.15)'
            padding={majorScale(2)}
            minWidth={200}
          >
            {/* Render each column checkbox. */}
            <Pane display='flex' flexDirection='column' gap={minorScale(2)}>
              {COLUMNS.map((column) => (
                <Checkbox
                  key={column}
                  checked={toggledColumns?.includes(column as Column) ?? false}
                  onChange={() => {
                    setToggledColumns((prev: Column[]) => {
                      if (prev.includes(column)) {
                        return prev.filter((c) => c !== column);
                      }
                      return [...prev, column];
                    });
                  }}
                  label={column}
                />
              ))}
            </Pane>
          </Pane>
        )}
      >
        {/* Render the button to open the dropdown. */}
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
          <Text>Columns ({toggledColumns?.length ?? 0})</Text>
          <ChevronDownIcon size={16} />
        </Button>
      </Popover>
    </Pane>
  );
}
