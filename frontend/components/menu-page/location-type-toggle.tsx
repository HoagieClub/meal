import { Pane, useTheme } from 'evergreen-ui';
import { LOCATION_TYPE_OPTIONS } from '@/lib/constants';
import type { LocationType } from '@/types';

interface LocationTypeToggleProps {
  locationType: LocationType;
  setLocationType: (type: LocationType) => void;
  vertical?: boolean;
}

const ICON_SIZES: Record<LocationType, { width: number; height: number }> = {
  residential: { width: 18, height: 16 },
  retail: { width: 12, height: 16 },
};

/** Pill toggle between dining halls and retail cafes, with a sliding highlight. */
export default function LocationTypeToggle({
  locationType,
  setLocationType,
  vertical,
}: LocationTypeToggleProps) {
  const theme = useTheme();
  const activeIndex = locationType === 'retail' ? 1 : 0;

  return (
    <div
      className={`flex ${vertical ? 'flex-col rounded-[20px]' : 'rounded-full'} relative overflow-hidden bg-[#a3d4b8]`}
    >
      <div
        className='absolute rounded-full transition-transform duration-300 ease-in-out'
        style={
          vertical
            ? {
                left: 0,
                right: 0,
                height: '50%',
                background: theme.colors.green700,
                transform: `translateY(${activeIndex * 100}%)`,
              }
            : {
                top: 0,
                bottom: 0,
                width: '50%',
                background: theme.colors.green700,
                transform: `translateX(${activeIndex * 100}%)`,
              }
        }
      />
      {LOCATION_TYPE_OPTIONS.map(({ type, label, lightIcon, darkIcon }) => {
        const active = locationType === type;
        const { width, height } = ICON_SIZES[type];
        return (
          <button
            key={type}
            type='button'
            aria-pressed={active}
            onClick={() => setLocationType(type)}
            className='relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-4 py-2'
          >
            <Pane position='relative' width={width} height={height}>
              <Pane
                position='absolute'
                top={0}
                left={0}
                right={0}
                bottom={0}
                opacity={active ? 0 : 1}
                className='transition-opacity duration-300 ease-in-out'
              >
                <img src={darkIcon} alt='' width={width} height={height} />
              </Pane>
              <Pane
                position='absolute'
                top={0}
                left={0}
                right={0}
                bottom={0}
                opacity={active ? 1 : 0}
                className='transition-opacity duration-300 ease-in-out'
              >
                <img src={lightIcon} alt='' width={width} height={height} />
              </Pane>
            </Pane>
            <span
              className={`text-sm font-bold whitespace-nowrap transition-all duration-300 ease-in-out select-none ${active ? 'text-white' : 'text-[#156534]'}`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
