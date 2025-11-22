'use client';
import { Pane, Text, Tooltip } from 'evergreen-ui';
import { Separator } from '@/components/ui/separator';

interface MacronutrientRowProps {
  label: string;
  amount: number | string | null;
  unit: string;
  dvPercent?: number;
}

export const MacronutrientRow = ({ label, amount, unit, dvPercent }: MacronutrientRowProps) => {
  if (amount === null || amount === undefined) return null;

  let color = 'green';
  if (dvPercent !== undefined) {
    if (dvPercent >= 20) {
      color = 'red';
    } else if (dvPercent >= 10) {
      color = 'orange';
    }
  }

  const dvInfo = (
    <Tooltip content='Approximate % Daily Value'>
      <Text textAlign='right' fontWeight={600} color={color}>
        {dvPercent}%
      </Text>
    </Tooltip>
  );

  return (
    <>
      <Pane display='grid' gridTemplateColumns='2fr 1fr 1fr' alignItems='center'>
        <Text fontWeight={500}>{label}</Text>
        <Text textAlign='right'>
          {amount ?? '—'}
          {unit}
        </Text>
        {dvPercent === undefined ? <Text textAlign='right'>—</Text> : dvInfo}
      </Pane>
      <Separator height='1px' marginTop={0} />
    </>
  );
};

export const MicronutrientRow = ({ label, dv }: { label: string; dv: any }) => {
  if (dv === null) return null;
  return (
    <>
      <Pane display='grid' gridTemplateColumns='2fr 1fr' alignItems='center'>
        <Text fontWeight={500}>{label}</Text>
        <Text textAlign='right' color='green700' fontWeight={600}>
          {dv ?? '—'}%
        </Text>
      </Pane>
      <Separator height='1px' marginTop={0} />
    </>
  );
};
