import { DefaultTheme, Pane } from 'evergreen-ui';

interface SkeletonBlockProps {
  width: string | number;
  height: string | number;
  theme: DefaultTheme;
  [key: string]: any;
}

export default function SkeletonBlock({ width, height, theme, ...props }: SkeletonBlockProps) {
  return (
    <Pane
      width={width}
      height={height}
      background={theme.colors.gray200}
      borderRadius={4}
      className='animate-pulse'
      {...props}
    />
  );
}
