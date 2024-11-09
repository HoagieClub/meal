import {Group, Button} from 'evergreen-ui';
import { ReactNode } from 'react';
import React from 'react'

// Displays Breakfast, Lunch, Dinner buttons for users to toggle menus
export default function BasicGroupExample({ children }: { children: ReactNode }) {
    const mealOptions = React.useMemo(
        () => [
          { label: 'Breakfast', value: 'breakfast' },
          { label: 'Lunch', value: 'lunch' },
          { label: 'Dinner', value: 'dinner' },
        ],
        []
      )
      const [selectedValue, setSelectedValue] = React.useState('dinner')
      
      return (
        <Group>
          {mealOptions.map(({ label, value }) => (
            <Button key={label} isActive={selectedValue === value} onClick={() => setSelectedValue(value)}>
              {label}
            </Button>
          ))}
        </Group>
      )
}