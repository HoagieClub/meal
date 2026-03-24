'use client';

import React from 'react';
import { Pane, Text, minorScale, Checkbox, useTheme } from 'evergreen-ui';
import { DINING_HALL_DISPLAY_NAMES } from '@/data';
import { HALL_ICON_MAP } from '@/styles';
import type { DiningHall } from '@/locations';

export interface DiningHallRowProps {
  diningHall: DiningHall;
  checked: boolean;
  onChange: () => void;
}

export default function DiningHallRow({ diningHall, checked, onChange }: DiningHallRowProps) {
  const theme = useTheme();
  const diningHallText = DINING_HALL_DISPLAY_NAMES[diningHall] ?? diningHall;

  return (
    <Pane display='flex' alignItems='center' height={30} cursor='pointer' onClick={onChange}>
      <Checkbox
        checked={checked}
        onChange={onChange}
        className='[&_input:checked+div]:!bg-green-700'
      />
      <Pane marginLeft={minorScale(2)} marginRight={minorScale(1)}>
        <img src={HALL_ICON_MAP[diningHall]} alt={diningHall} width={15} height={15} />
      </Pane>
      <Text size={300} color={theme.colors.gray900}>
        {diningHallText}
      </Text>
    </Pane>
  );
}
