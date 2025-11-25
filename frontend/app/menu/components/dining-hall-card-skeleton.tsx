import { Pane, majorScale, minorScale } from 'evergreen-ui';
import { DefaultTheme } from 'evergreen-ui';
import SkeletonBlock from '@/components/SkeletonBlock';

export default function SkeletonDiningHallCard({ theme }: { theme: DefaultTheme }) {
  return (
    <Pane
      background='white'
      borderRadius={12}
      padding={majorScale(2)}
      border={`1px solid ${theme.colors.green300}`}
      display='flex'
      flexDirection='column'
      gap={majorScale(2)}
    >
      <SkeletonBlock width='70%' height={24} theme={theme} />
      <Pane display='flex' gap={minorScale(1)}>
        <SkeletonBlock width={24} height={24} borderRadius={999} theme={theme} />
        <SkeletonBlock width={24} height={24} borderRadius={999} theme={theme} />
        <SkeletonBlock width={24} height={24} borderRadius={999} theme={theme} />
      </Pane>
      <Pane>
        <SkeletonBlock width='50%' height={18} theme={theme} marginBottom={majorScale(1)} />
        <SkeletonBlock width='90%' height={14} theme={theme} marginBottom={minorScale(1)} />
        <SkeletonBlock width='80%' height={14} theme={theme} marginBottom={minorScale(1)} />
      </Pane>
      <Pane>
        <SkeletonBlock width='60%' height={18} theme={theme} marginBottom={majorScale(1)} />
        <SkeletonBlock width='85%' height={14} theme={theme} marginBottom={minorScale(1)} />
      </Pane>
    </Pane>
  );
}
