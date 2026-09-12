'use client';

import Image from 'next/image';
import { Heading, majorScale, minorScale, Pane, Text, useTheme } from 'evergreen-ui';
import MenuItemRow from '@/components/dining-hall-card/menu-item-row';
import { DINING_HALL_BANNERS } from '@/lib/banners';
import { canonicalIndex, DINING_HALL_INFO, SECTION_TITLE_ORDER } from '@/lib/constants';
import type { DiningHall } from '@/lib/constants';
import { servesMeal } from '@/lib/hours';
import { mealLabel } from '@/lib/menus';
import type { DisplayLocation, DisplayMenuItem, LocationType, Meal } from '@/types';

interface DiningHallCardProps {
  diningHall: DisplayLocation;
  isPinned: boolean;
  onPinToggle: () => void;
  /** The day and meal being shown, used to explain an empty card. */
  date: Date;
  meal: Meal;
  locationType: LocationType;
  /** Position in the grid, used to stagger the entrance animation. */
  index?: number;
  /** Keep the name in view while the card's list scrolls past. */
  stickyHeader?: boolean;
}

export default function DiningHallCard({
  diningHall,
  isPinned,
  onPinToggle,
  date,
  meal,
  locationType,
  index = 0,
  stickyHeader = false,
}: DiningHallCardProps) {
  const theme = useTheme();
  const info = DINING_HALL_INFO[diningHall.name as DiningHall];
  const banner = DINING_HALL_BANNERS[diningHall.name as DiningHall];
  const closed = !servesMeal(diningHall.id, date, meal, locationType);
  const empty = diningHall.menu.length === 0;
  const filteredOut = diningHall.rawMenuCount > 0 && empty;

  const sectionOf = (item: DisplayMenuItem) => item.category || 'Other';
  const sections = [...new Set(diningHall.menu.map(sectionOf))].sort((a, b) => {
    const aIndex = canonicalIndex(a, SECTION_TITLE_ORDER);
    const bIndex = canonicalIndex(b, SECTION_TITLE_ORDER);
    return aIndex !== bIndex ? aIndex - bIndex : a.localeCompare(b);
  });

  return (
    <Pane
      background='white'
      borderRadius={15}
      boxShadow='0 2px 8px rgba(0,0,0,0.08)'
      padding={majorScale(3)}
      display='flex'
      flexDirection='column'
      // Cards with a menu fill their grid row; empty ones stay short instead of stretching.
      height={empty ? undefined : '100%'}
      alignSelf={empty ? 'start' : undefined}
      className='card-fade-up'
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/*
        Negative margins let the header span the card padding. The background is solid behind the
        name bar and only fades in the bottom padding, so list content scrolling underneath never
        shows through the text.
      */}
      <div
        className={`rounded-t-[15px] ${stickyHeader ? 'sticky top-0 z-10' : ''}`}
        style={{
          margin: '-24px -24px -16px',
          padding: 24,
          background:
            'linear-gradient(to top, rgba(255,255,255,0) 0, rgba(255,255,255,0) 14px, #fff 24px)',
          overflow: 'hidden',
        }}
      >
        <Pane
          background={theme.colors.gray200}
          className='relative flex items-center rounded-md border border-gray-300 py-2'
        >
          {/* The pin and banner overlay the right end, so the name gets room and truncates. */}
          <Pane paddingX={majorScale(2)} paddingY={minorScale(1)} className='min-w-0 flex-1 pr-36'>
            <Heading is='h2' size={600} color={theme.colors.gray900} className='truncate'>
              {info?.shortName ?? diningHall.name}
            </Heading>
          </Pane>
          <Pane className='absolute right-[-1rem] flex h-[140%] items-center'>
            <button
              type='button'
              onClick={onPinToggle}
              aria-pressed={isPinned}
              aria-label={isPinned ? 'Unpin hall' : 'Pin hall'}
              title={isPinned ? 'Unpin hall' : 'Pin hall'}
              className='mr-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-transform duration-200 hover:scale-95 active:scale-85'
            >
              <img
                src={isPinned ? '/images/icons/pinned.svg' : '/images/icons/unpinned.svg'}
                width={16}
                height={16}
                alt=''
              />
            </button>
            {banner && (
              <Image
                src={banner}
                className='my-auto h-full w-auto'
                alt=''
                sizes='160px'
                loading='lazy'
                quality={75}
              />
            )}
          </Pane>
        </Pane>
      </div>

      {empty ? (
        <EmptyState
          filteredOut={filteredOut}
          closed={closed}
          date={date}
          meal={meal}
          locationType={locationType}
        />
      ) : (
        sections.map((section) => (
          <MenuSection
            key={section}
            title={section}
            items={diningHall.menu.filter((item) => sectionOf(item) === section)}
            diningHallName={diningHall.name}
          />
        ))
      )}
    </Pane>
  );
}

function MenuSection({
  title,
  items,
  diningHallName,
}: {
  title: string;
  items: DisplayMenuItem[];
  diningHallName: string;
}) {
  const theme = useTheme();
  return (
    <Pane marginTop={majorScale(1)}>
      <Pane
        display='grid'
        gridTemplateColumns='2fr 1fr'
        columnGap={minorScale(2)}
        rowGap={minorScale(1)}
        borderBottom={`1px solid ${theme.colors.green300}`}
        paddingBottom={minorScale(1)}
        marginBottom={minorScale(1)}
        background={theme.colors.gray100}
        className='rounded-t-lg'
      >
        <Text
          size={400}
          fontWeight={600}
          textAlign='left'
          className='col-span-2 -mb-[2px] pt-1 pl-2'
          textTransform='uppercase'
        >
          {title}
        </Text>
      </Pane>
      {items.map((item) => (
        <MenuItemRow key={item.id} item={item} diningHallName={diningHallName} />
      ))}
    </Pane>
  );
}

/** Why a card is empty: filtered out, not open for this meal or day, or no menu published yet. */
function EmptyState({
  filteredOut,
  closed,
  date,
  meal,
  locationType,
}: {
  filteredOut: boolean;
  /** The hours table says this location does not serve this meal on this day. */
  closed: boolean;
  date: Date;
  meal: Meal;
  locationType: LocationType;
}) {
  const theme = useTheme();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });

  let title: string;
  let detail: string;
  if (filteredOut) {
    title = 'Filtered out';
    detail = 'Try adjusting your search or filters';
  } else if (closed) {
    title = 'Closed';
    detail =
      locationType === 'residential'
        ? `Not open for ${mealLabel(meal, date).toLowerCase()} on ${weekday}s`
        : `Closed on ${weekday}s`;
  } else {
    title = 'Nothing here';
    detail = 'No menu has been published for this meal yet';
  }

  return (
    <Pane
      display='flex'
      alignItems='center'
      gap={majorScale(2)}
      paddingTop={majorScale(3)}
      paddingX={minorScale(2)}
    >
      <img
        src={filteredOut ? '/images/icons/funnel-x.svg' : '/images/icons/no-food.svg'}
        width={36}
        height={36}
        alt=''
      />
      <Pane display='flex' flexDirection='column'>
        <Text size={400} fontWeight={600} color={theme.colors.gray700}>
          {title}
        </Text>
        <Text size={300} color={theme.colors.gray500}>
          {detail}
        </Text>
      </Pane>
    </Pane>
  );
}
