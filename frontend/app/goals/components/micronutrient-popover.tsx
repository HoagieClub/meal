import { Nutrients } from '../types';
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
import { MICRONUTRIENTS_MAP } from '../data';

export default function MicronutrientPopover({ nutrition }: { nutrition: Nutrients }) {
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
