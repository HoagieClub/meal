// components/Separator.tsx
import { Pane, minorScale } from 'evergreen-ui';

interface SeparatorProps {
  height?: string | number;
  marginTop?: number;
}

export const Separator: React.FC<SeparatorProps> = ({
  height = '2px',
  marginTop = minorScale(3),
}) => {
  return <Pane background='green700' height={height} marginTop={marginTop} borderRadius={2} />;
};
