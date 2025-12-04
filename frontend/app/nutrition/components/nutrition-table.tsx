import { majorScale, minorScale, Pane, Text } from 'evergreen-ui';
import { Separator } from '@/components/ui/separator';
import { MacronutrientRow, MicronutrientRow } from './nutrient-rows';
import { NutrientInfo } from '../types';
import { MACRONUTRIENTS, MICRONUTRIENTS } from '../data';

export default function NutritionTable({ nutrient }: { nutrient: NutrientInfo }) {
  const macronutrients = MACRONUTRIENTS(nutrient);
  const micronutrients = MICRONUTRIENTS(nutrient);

  return (
    <Pane className='col-span-2'>
      <Pane display='grid' gridTemplateColumns='2fr 1fr 1fr' fontWeight={600}>
        <Text fontWeight={500} fontSize={15} color='green800'>
          Macronutrients
        </Text>
        <Text textAlign='right'>Amount</Text>
        <Text textAlign='right'>Est. %DV</Text>
      </Pane>
      <Separator height='3px' />

      <Pane
        marginTop={minorScale(1)}
        paddingTop={minorScale(1)}
        display='grid'
        rowGap={minorScale(2)}
      >
        {macronutrients.map((nutrient) => (
          <MacronutrientRow
            key={nutrient.label}
            label={nutrient.label}
            amount={nutrient.amount}
            unit={nutrient.unit}
            dvPercent={nutrient.dvPercent}
          />
        ))}
      </Pane>

      <Pane display='grid' gridTemplateColumns='2fr 1fr' fontWeight={600} marginTop={majorScale(3)}>
        <Text fontWeight={500} fontSize={15} color='green800'>
          Micronutrients
        </Text>
        <Text textAlign='right'>% Daily Value</Text>
      </Pane>
      <Separator height='3px' />

      <Pane
        marginTop={minorScale(1)}
        paddingTop={minorScale(1)}
        display='grid'
        rowGap={minorScale(2)}
      >
        {micronutrients.map((nutrient) => (
          <MicronutrientRow
            key={nutrient.label}
            label={nutrient.label}
            dvPercent={nutrient.dvPercent}
          />
        ))}
      </Pane>
    </Pane>
  );
}
