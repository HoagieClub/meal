import { Pane, useTheme, Text, minorScale } from 'evergreen-ui';
import { NutrientProgressBarProps } from '../types';

export default function NutrientProgressBar({
  label,
  value,
  target,
  unit,
}: NutrientProgressBarProps) {
  const theme = useTheme();
  const p = target > 0 ? (value / target) * 100 : 0;
  const fillPercent = Math.min(p, 100);
  const overflowPercent = Math.max(0, p - 100);

  // We set a color based on how close we are to the target.
  const isUnder = p < 85;
  const isOver = p > 115;

  let fillColor: string;
  if (isOver) {
    fillColor = theme.colors.blue500;
  } else if (isUnder) {
    fillColor = theme.colors.orange500;
  } else {
    fillColor = theme.colors.green500;
  }

  return (
    <Pane>
      <Pane
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        marginBottom={minorScale(1)}
      >
        <Text size={300} fontWeight={600} color='#334155'>
          {label}
        </Text>
        <Text size={300} color='#64748b' fontWeight={500}>
          {Math.round(value)} / {target} {unit}
        </Text>
      </Pane>
      <Pane
        position='relative'
        height={6}
        background={theme.colors.gray300}
        borderRadius={8}
        overflow='hidden'
        className='shadow-inner'
      >
        <Pane
          height='100%'
          width={`${fillPercent}%`}
          backgroundColor={fillColor}
          borderRadius={8}
          transition='width 0.5s ease-in-out'
        />
        {/* If you go way over, we show a red overflow bar. */}
        {overflowPercent > 0 && (
          <Pane
            position='absolute'
            left={`${fillPercent}%`}
            top={0}
            height='100%'
            width={`${Math.min(overflowPercent, 100)}%`}
            backgroundColor={theme.colors.red500}
          />
        )}
      </Pane>
    </Pane>
  );
}
