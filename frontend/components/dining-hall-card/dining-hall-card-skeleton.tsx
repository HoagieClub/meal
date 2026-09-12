import { majorScale, minorScale, Pane, useTheme } from 'evergreen-ui';

// Section shapes to mimic: [title width, line widths].
const SECTIONS: [string, string[]][] = [
  ['50%', ['90%', '80%']],
  ['60%', ['85%']],
  ['50%', ['90%', '80%']],
  ['60%', ['85%']],
  ['50%', ['90%', '80%']],
  ['60%', ['85%']],
];

function Block({
  width,
  height,
  borderRadius = 4,
  marginBottom,
}: {
  width: string | number;
  height: number;
  borderRadius?: number;
  marginBottom?: number;
}) {
  const theme = useTheme();
  return (
    <Pane
      width={width}
      height={height}
      background={theme.colors.gray200}
      borderRadius={borderRadius}
      marginBottom={marginBottom}
      className='animate-pulse'
    />
  );
}

/** Loading placeholder shaped like a dining hall card. */
export default function DiningHallCardSkeleton() {
  return (
    <Pane
      background='white'
      borderRadius={15}
      padding={majorScale(3)}
      display='flex'
      flexDirection='column'
      gap={majorScale(2)}
    >
      <Block width='70%' height={24} />
      <Pane display='flex' gap={minorScale(1)}>
        {[0, 1, 2].map((i) => (
          <Block key={i} width={24} height={24} borderRadius={999} />
        ))}
      </Pane>
      {SECTIONS.map(([titleWidth, lines], i) => (
        <Pane key={i}>
          <Block width={titleWidth} height={18} marginBottom={majorScale(1)} />
          {lines.map((lineWidth, j) => (
            <Block key={j} width={lineWidth} height={14} marginBottom={minorScale(1)} />
          ))}
        </Pane>
      ))}
    </Pane>
  );
}
