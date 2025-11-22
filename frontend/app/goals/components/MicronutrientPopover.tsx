import { Nutrients } from '@/types/goals';
import {
  majorScale,
  Pane,
  Popover,
  Position,
  Heading,
  Text,
  minorScale,
  IconButton,
  MoreIcon,
} from 'evergreen-ui';

export default function MicronutrientPopover({ nutrition }: { nutrition: Nutrients }) {
  const MICRONUTRIENTS_MAP: { key: keyof Nutrients; name: string; unit: string }[] = [
    { key: 'calcium', name: 'Calcium', unit: 'mg' },
    { key: 'iron', name: 'Iron', unit: 'mg' },
    { key: 'potassium', name: 'Potassium', unit: 'mg' },
    { key: 'vitaminD', name: 'Vitamin D', unit: 'mcg' },
    { key: 'vitaminA', name: 'Vitamin A', unit: 'mcg' },
    { key: 'vitaminC', name: 'Vitamin C', unit: 'mg' },
    { key: 'magnesium', name: 'Magnesium', unit: 'mg' },
    { key: 'zinc', name: 'Zinc', unit: 'mg' },
    { key: 'sodium', name: 'Sodium', unit: 'mg' },
    { key: 'cholesterol', name: 'Cholesterol', unit: 'mg' },
    { key: 'fiber', name: 'Fiber', unit: 'g' },
    { key: 'sugar', name: 'Sugar', unit: 'g' },
  ];

  const availableMicros = MICRONUTRIENTS_MAP.filter(
    (micro) => nutrition[micro.key] !== undefined && nutrition[micro.key] > 0
  );

  if (availableMicros.length === 0) return null;

  return (
    <Popover
      position={Position.BOTTOM_RIGHT}
      content={
        <Pane
          padding={majorScale(2)}
          width={240}
          display='flex'
          flexDirection='column'
          gap={minorScale(2)}
        >
          <Heading size={400}>Nutrition Details</Heading>
          {availableMicros.map((micro) => (
            <Pane key={micro.key} display='flex' justifyContent='space-between'>
              <Text size={300}>{micro.name}</Text>
              <Text size={300} color='muted'>
                {Math.round(nutrition[micro.key])} {micro.unit}
              </Text>
            </Pane>
          ))}
        </Pane>
      }
    >
      <IconButton icon={MoreIcon} appearance='minimal' height={24} title='View Micronutrients' />
    </Popover>
  );
}
