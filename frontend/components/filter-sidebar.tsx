'use client';

import type { ChangeEvent, ReactNode } from 'react';
import {
  Checkbox,
  ChevronLeftIcon,
  CrossIcon,
  majorScale,
  minorScale,
  Pane,
  SearchInput,
  Text,
  UndoIcon,
  useTheme,
} from 'evergreen-ui';
import {
  ALLERGEN_ICON_MAP,
  DINING_HALL_INFO,
  RESIDENTIAL_HALL_ORDER,
  RETAIL_LOCATION_ORDER,
} from '@/lib/constants';
import type { DiningHall } from '@/lib/constants';
import { ALLERGENS } from '@/types';
import type { Allergen, LocationType } from '@/types';

export interface FilterSidebarProps {
  locationType: LocationType;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  starredOnly: boolean;
  setStarredOnly: (starredOnly: boolean) => void;
  diningHalls: DiningHall[];
  allergens: Allergen[];
  toggleDiningHall: (hall: DiningHall) => void;
  toggleAllergen: (allergen: Allergen) => void;
  clearPreferences: () => void;
  /** `sidebar` is the desktop panel with its own search box; `popover` drops down from the mobile filter bar. */
  variant: 'sidebar' | 'popover';
  onClose: () => void;
}

/** Search, starred-only switch, dining hall and allergen filters for the menu page. */
export default function FilterSidebar(props: FilterSidebarProps) {
  const { variant, onClose, searchTerm, setSearchTerm, setStarredOnly, clearPreferences } = props;
  const theme = useTheme();
  const divider = `1px solid ${theme.colors.gray200}`;

  const header = (
    <Pane
      display='flex'
      alignItems='center'
      justifyContent='space-between'
      marginBottom={variant === 'sidebar' ? minorScale(1) : 0}
    >
      <HeaderButton
        className='-ml-2'
        onClick={() => {
          clearPreferences();
          setSearchTerm('');
          setStarredOnly(false);
        }}
      >
        <UndoIcon size={14} color={theme.colors.gray700} />
        <Text marginLeft={minorScale(1)} size={300} color={theme.colors.gray700}>
          Reset
        </Text>
      </HeaderButton>
      <HeaderButton
        className='-mr-2'
        onClick={onClose}
        label={variant === 'sidebar' ? undefined : 'Close filters'}
      >
        {variant === 'sidebar' ? (
          <>
            <ChevronLeftIcon size={14} color={theme.colors.gray600} />
            <Text marginLeft={minorScale(1)} size={300} color={theme.colors.gray600}>
              Hide
            </Text>
          </>
        ) : (
          <CrossIcon size={20} color={theme.colors.gray600} />
        )}
      </HeaderButton>
    </Pane>
  );

  if (variant === 'popover') {
    return (
      <Pane>
        <Pane
          background={theme.colors.gray100}
          borderBottom={divider}
          className='relative flex flex-col p-4 pb-2'
        >
          {header}
        </Pane>
        <StarredRow {...props} />
        {/* Tablets get the two lists side by side instead of one long column. */}
        <Pane className='p-4 sm:grid sm:grid-cols-2 sm:gap-x-8'>
          <FilterLists {...props} />
        </Pane>
        {/* Stays visible at the bottom of the drawer, however far the lists scroll. */}
        <Pane className='sticky bottom-0 px-4 py-3' background='white' borderTop={divider}>
          <button
            type='button'
            onClick={onClose}
            className='w-full rounded-full py-2 text-sm font-semibold text-white transition-opacity active:opacity-80'
            style={{ background: theme.colors.green700 }}
          >
            Done
          </button>
        </Pane>
      </Pane>
    );
  }

  return (
    <Pane width={280} padding={majorScale(3)} className='z-20'>
      <Pane
        display='flex'
        flexDirection='column'
        background='white'
        boxShadow='0 2px 8px rgba(0,0,0,0.08)'
        borderRadius={12}
        className='overflow-hidden select-none'
      >
        <Pane
          borderTopLeftRadius={12}
          borderTopRightRadius={12}
          background={theme.colors.gray100}
          borderBottom={divider}
          className='relative flex flex-col p-4'
        >
          {header}
          <Pane borderBottom={divider} marginBottom={minorScale(2)} />
          <SectionLabel>Search Food</SectionLabel>
          <SearchInput
            placeholder='Search for food...'
            aria-label='Search for food'
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            autoComplete='off'
            spellCheck={false}
          />
        </Pane>
        <StarredRow {...props} />
        <Pane className='p-4'>
          <FilterLists {...props} />
        </Pane>
      </Pane>
    </Pane>
  );
}

function HeaderButton({
  onClick,
  className,
  label,
  children,
}: {
  onClick: () => void;
  className: string;
  /** Accessible name for an icon-only button. */
  label?: string;
  children: ReactNode;
}) {
  return (
    <Pane
      is='button'
      type='button'
      aria-label={label}
      display='flex'
      alignItems='center'
      cursor='pointer'
      onClick={onClick}
      className={`-mt-2 space-x-1 rounded-sm px-2 py-1 transition-colors duration-200 hover:bg-gray-200 ${className}`}
    >
      {children}
    </Pane>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text size={300} fontWeight={600} color={theme.colors.gray800} marginBottom={minorScale(1)}>
      {children}
    </Text>
  );
}

/** Show only the items the user has starred. */
function StarredRow({ starredOnly, setStarredOnly }: FilterSidebarProps) {
  const theme = useTheme();
  return (
    <Pane className='px-4 pt-3'>
      <CheckboxRow
        label='Starred items only'
        icon='/images/icons/star.svg'
        checked={starredOnly}
        onChange={() => setStarredOnly(!starredOnly)}
      />
      <Pane borderBottom={`1px solid ${theme.colors.gray200}`} marginTop={minorScale(1)} />
    </Pane>
  );
}

function FilterLists({
  locationType,
  diningHalls,
  allergens,
  toggleDiningHall,
  toggleAllergen,
}: FilterSidebarProps) {
  const theme = useTheme();
  const halls = locationType === 'residential' ? RESIDENTIAL_HALL_ORDER : RETAIL_LOCATION_ORDER;

  return (
    <>
      <Pane>
        <SectionLabel>
          {locationType === 'residential' ? 'Dining Halls' : 'Retail Locations'}
        </SectionLabel>
        <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
          {halls.map((hall) => (
            <CheckboxRow
              key={hall}
              label={DINING_HALL_INFO[hall].shortName}
              icon={DINING_HALL_INFO[hall].icon}
              checked={diningHalls.includes(hall)}
              onChange={() => toggleDiningHall(hall)}
            />
          ))}
        </Pane>
        <Pane
          borderBottom={`1px solid ${theme.colors.gray200}`}
          marginBottom={minorScale(2)}
          className='sm:hidden'
        />
      </Pane>

      <Pane>
        <Pane marginBottom={minorScale(1)}>
          <SectionLabel>Allergen Tags</SectionLabel>
        </Pane>
        <span className='text-xs text-[#808080]'>Exclude items containing:</span>
        <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
          {ALLERGENS.map((allergen) => (
            <CheckboxRow
              key={allergen}
              label={allergen}
              icon={ALLERGEN_ICON_MAP[allergen]}
              checked={allergens.includes(allergen)}
              onChange={() => toggleAllergen(allergen)}
            />
          ))}
        </Pane>
      </Pane>
    </>
  );
}

/** A checkbox whose whole row, icon and text included, is its label. */
function CheckboxRow({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string;
  icon: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <Checkbox
      checked={checked}
      onChange={onChange}
      marginY={0}
      height={30}
      className='[&_input:checked+div]:bg-green-700'
      label={
        <span className='flex items-center gap-1.5 text-xs !text-gray-900'>
          <img src={icon} alt='' width={15} height={15} />
          {label}
        </span>
      }
    />
  );
}
