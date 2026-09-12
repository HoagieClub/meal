'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  FilterListIcon,
  Heading,
  majorScale,
  minorScale,
  Pane,
  Text,
  useTheme,
} from 'evergreen-ui';
import DiningHallCard from '@/components/dining-hall-card/dining-hall-card';
import DiningHallCardSkeleton from '@/components/dining-hall-card/dining-hall-card-skeleton';
import FilterSidebar from '@/components/filter-sidebar';
import LoginPrompt from '@/components/login-prompt';
import DateMealSelector from '@/components/menu-page/date-meal-selector';
import LocationTypeToggle from '@/components/menu-page/location-type-toggle';
import MobileFilterBar from '@/components/menu-page/mobile-filter-bar';
import SplashScreen from '@/components/splash-screen';
import { useHydrated } from '@/hooks/use-hydrated';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMenus } from '@/hooks/use-menus';
import { usePreferencesCache } from '@/hooks/use-preferences-cache';
import { typicalMealRange } from '@/lib/hours';
import type { DiningHall } from '@/lib/constants';
import { availableMeals, buildDisplayData, defaultMeal, mealLabel } from '@/lib/menus';
import { startOfToday, toDateKey } from '@/lib/utils';
import type { DisplayLocation, LocationType, Meal } from '@/types';

const SIDEBAR_WIDTH = 280;
const CONTENT_PADDING = 24;
// Cards shrink to the container on phones narrower than the preferred column width.
const GRID_COLUMNS = 'repeat(auto-fill,minmax(min(360px,100%),1fr))';
// Below this content width the title, date selector and location toggle no longer fit in a row.
const HEADER_ROW_MIN_WIDTH = 880;
// Phones and tablets, including an iPad in landscape, get the compact header and filter drawer.
const COMPACT_LAYOUT_QUERY = '(max-width: 1024px)';
// With the sidebar open, the header only has the window minus the sidebar and padding to work with.
const NARROW_WITH_SIDEBAR_QUERY = `(max-width: ${SIDEBAR_WIDTH + CONTENT_PADDING + HEADER_ROW_MIN_WIDTH - 1}px)`;
// Tabs shown until the day's data says which meals are actually served.
const FALLBACK_MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner'];

export default function MenuPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday);
  const [meal, setMeal] = useState<Meal>(() => defaultMeal(FALLBACK_MEALS));
  const [locationType, setLocationType] = useState<LocationType>('residential');
  const [searchTerm, setSearchTerm] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileScrolled, setMobileScrolled] = useState(false);

  const dateKey = toDateKey(selectedDate);
  const menus = useMenus(dateKey);
  const data = menus.data ?? null;
  const preferences = usePreferencesCache();

  // Meal tabs come from the data: some halls serve breakfast at weekends, others skip dinner.
  const servedMeals = useMemo(() => availableMeals(data?.residentialMenus ?? {}), [data]);
  const meals = servedMeals.length > 0 ? servedMeals : FALLBACK_MEALS;
  useEffect(() => {
    if (servedMeals.length > 0 && !servedMeals.includes(meal)) setMeal(defaultMeal(servedMeals));
  }, [servedMeals, meal]);

  useEffect(() => {
    const onScroll = () => setMobileScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const compactLayout = useMediaQuery(COMPACT_LAYOUT_QUERY);
  // The date, meal and layout all depend on the visitor's browser, so the page body only renders
  // once it is hydrated; until then the splash screen is all the server sends.
  const hydrated = useHydrated();
  const narrowWithSidebar = useMediaQuery(NARROW_WITH_SIDEBAR_QUERY);
  // Without the sidebar every laptop window is wide enough for the header's three groups.
  const stackMenuHeader = preferences.sidebarOpen && narrowWithSidebar;

  const { diningHalls, allergens, pinnedHalls } = preferences;
  const { displayData, hasAnyRawLocations } = useMemo(
    () =>
      buildDisplayData(data, {
        locationType,
        meal,
        searchTerm,
        starredOnly,
        diningHalls,
        allergens,
        pinnedHalls,
      }),
    [data, locationType, meal, searchTerm, starredOnly, diningHalls, allergens, pinnedHalls]
  );

  const filterProps = {
    locationType,
    searchTerm,
    setSearchTerm,
    starredOnly,
    setStarredOnly,
    diningHalls: preferences.diningHalls,
    allergens: preferences.allergens,
    toggleDiningHall: preferences.toggleDiningHall,
    toggleAllergen: preferences.toggleAllergen,
    clearPreferences: preferences.clearAll,
  };
  const selectorProps = { meal, setMeal, meals, selectedDate, setSelectedDate, locationType };

  return (
    <>
      <SplashScreen />
      <LoginPrompt />
      {hydrated && (
        <Pane
          display='flex'
          className='min-h-screen flex-col sm:flex-row'
          style={{ overflowX: 'clip' }}
        >
          {!compactLayout && (
            <div
              className='sidebar-slide-wrapper'
              style={{
                width: preferences.sidebarOpen ? SIDEBAR_WIDTH : 0,
                minWidth: preferences.sidebarOpen ? SIDEBAR_WIDTH : 0,
                transform: `translateX(${preferences.sidebarOpen ? 0 : -SIDEBAR_WIDTH}px)`,
              }}
            >
              <FilterSidebar
                {...filterProps}
                variant='sidebar'
                onClose={() => preferences.setSidebarOpen(false)}
              />
            </div>
          )}

          {/* minWidth 0 lets this flex column shrink below its content instead of overflowing the window. */}
          <Pane flex={1} minWidth={0} className='no-scrollbar h-full' style={{ overflowX: 'clip' }}>
            {compactLayout && (
              <>
                {/* Sticky compact header with the filter drawer layered on top. */}
                <div
                  className={`bg-hoagiemeal-mint sticky top-0 z-50 transition-shadow duration-200 ${mobileScrolled ? 'shadow-[0px_4px_8px_rgba(0,0,0,0.1)]' : ''}`}
                >
                  {/* Fixed to the window so the drawer can use the full height and its Done button stays reachable. */}
                  <div
                    className='fixed top-0 right-0 left-0 z-[60]'
                    style={{ pointerEvents: mobileFilterOpen ? 'auto' : 'none' }}
                  >
                    <div
                      className='mobile-filter-popover'
                      data-state={mobileFilterOpen ? 'open' : 'closed'}
                    >
                      <div className='mobile-filter-popover-inner max-h-[100dvh] overflow-y-auto rounded-b-[20px] bg-white shadow-[0px_4px_8px_rgba(0,0,0,0.15)]'>
                        <FilterSidebar
                          {...filterProps}
                          variant='popover'
                          onClose={() => setMobileFilterOpen(false)}
                        />
                      </div>
                    </div>
                  </div>
                  <MobileFilterBar
                    locationType={locationType}
                    setLocationType={setLocationType}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterOpen={mobileFilterOpen}
                    setFilterOpen={setMobileFilterOpen}
                  />
                </div>
                <div className='flex flex-col items-center px-4 pt-2 text-center'>
                  <MealTitle
                    meal={meal}
                    locationType={locationType}
                    selectedDate={selectedDate}
                    size='mobile'
                  />
                </div>
                {/* Full width on phones; capped on tablets so the tabs do not stretch across the screen. */}
                <div className='mx-auto w-full max-w-md px-4'>
                  <DateMealSelector {...selectorProps} />
                </div>
              </>
            )}

            <Pane
              paddingRight={CONTENT_PADDING}
              paddingLeft={compactLayout || !preferences.sidebarOpen ? CONTENT_PADDING : 0}
            >
              <Pane maxWidth={1200} marginX='auto' width='100%'>
                {!compactLayout && (
                  <DesktopHeader
                    {...selectorProps}
                    setLocationType={setLocationType}
                    sidebarOpen={preferences.sidebarOpen}
                    setSidebarOpen={preferences.setSidebarOpen}
                    stackMenuHeader={stackMenuHeader}
                  />
                )}

                <MenuCardGrid
                  loading={menus.isPending || (menus.isError && menus.isFetching)}
                  error={data ? null : (menus.error?.message ?? null)}
                  onRetry={() => void menus.refetch()}
                  displayData={displayData}
                  hasAnyRawData={hasAnyRawLocations}
                  dateKey={dateKey}
                  pinnedHalls={preferences.pinnedHalls}
                  togglePinnedHall={preferences.togglePinnedHall}
                  stickyHeaders={!compactLayout}
                  date={selectedDate}
                  meal={meal}
                  locationType={locationType}
                />
              </Pane>
            </Pane>
          </Pane>
        </Pane>
      )}
    </>
  );
}

function MealTitle({
  meal,
  locationType,
  selectedDate,
  size,
}: {
  meal: Meal;
  locationType: LocationType;
  selectedDate: Date;
  size: 'desktop' | 'mobile';
}) {
  const theme = useTheme();
  const title = locationType === 'retail' ? 'Retail' : mealLabel(meal, selectedDate);
  const hours =
    locationType === 'retail' ? 'Hours vary by cafe' : (typicalMealRange(meal, selectedDate) ?? '');

  // Keys re-trigger the entrance animation whenever the title changes.
  if (size === 'mobile') {
    return (
      <Text
        key={title}
        className='meal-title-enter text-xl'
        color={theme.colors.green700}
        fontWeight={700}
      >
        {title}: {hours}
      </Text>
    );
  }

  return (
    <>
      <Heading
        key={title}
        className='meal-title-enter text-5xl'
        color={theme.colors.green700}
        fontWeight={900}
      >
        {title}
      </Heading>
      <Text
        key={`hours-${title}`}
        className='meal-title-enter text-xl'
        color={theme.colors.green600}
        fontWeight={600}
        style={{ animationDelay: '30ms' }}
      >
        {hours}
      </Text>
    </>
  );
}

/**
 * Desktop header. Wide: meal title, date selector and location toggle in a row. Narrow: the title
 * and toggle share the first row and the selector sits centred beneath them.
 */
function DesktopHeader({
  meal,
  setMeal,
  meals,
  selectedDate,
  setSelectedDate,
  locationType,
  setLocationType,
  sidebarOpen,
  setSidebarOpen,
  stackMenuHeader,
}: {
  meal: Meal;
  setMeal: (meal: Meal) => void;
  meals: Meal[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  locationType: LocationType;
  setLocationType: (type: LocationType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  stackMenuHeader: boolean;
}) {
  const title = (
    <div className={`flex flex-col items-start ${stackMenuHeader ? '' : 'w-60'}`}>
      <MealTitle
        meal={meal}
        locationType={locationType}
        selectedDate={selectedDate}
        size='desktop'
      />
      <SidebarToggleButton sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    </div>
  );
  const selector = (
    <DateMealSelector
      meal={meal}
      setMeal={setMeal}
      meals={meals}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      locationType={locationType}
    />
  );
  const toggle = (
    <LocationTypeToggle
      locationType={locationType}
      setLocationType={setLocationType}
      vertical={!stackMenuHeader}
    />
  );

  if (stackMenuHeader) {
    return (
      <div className='my-2 flex flex-col'>
        <div className='flex items-start justify-between gap-4'>
          {title}
          <div className='pt-3'>{toggle}</div>
        </div>
        <div className='flex justify-center'>{selector}</div>
      </div>
    );
  }
  return (
    <div className='my-2 flex flex-row items-center justify-between'>
      {title}
      {selector}
      <div className='flex w-60 justify-end'>{toggle}</div>
    </div>
  );
}

/** The "Search & Filter" pill that collapses away while the sidebar is open. */
function SidebarToggleButton({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
    <Pane
      is='button'
      type='button'
      display='inline-flex'
      alignItems='center'
      gap={minorScale(2)}
      cursor={sidebarOpen ? 'default' : 'pointer'}
      onClick={sidebarOpen ? undefined : () => setSidebarOpen(true)}
      tabIndex={sidebarOpen ? -1 : 0}
      aria-hidden={sidebarOpen}
      borderRadius={999}
      className='bg-[#A2D4B8]/50 select-none'
      style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        opacity: sidebarOpen ? 0 : 1,
        maxWidth: sidebarOpen ? 0 : 200,
        height: sidebarOpen ? 0 : 28,
        marginTop: sidebarOpen ? 0 : 12,
        paddingLeft: sidebarOpen ? 0 : 12,
        paddingRight: sidebarOpen ? 0 : 12,
        pointerEvents: sidebarOpen ? 'none' : 'auto',
        transition:
          'max-width 250ms ease, padding 250ms ease, height 250ms ease, margin-top 250ms ease, opacity 150ms ease',
      }}
    >
      <FilterListIcon size={12} className='text-[#156534]' />
      <Text fontSize={12} className='text-[#156534]' fontWeight={600}>
        Search & Filter
      </Text>
    </Pane>
  );
}

/** Loading skeletons, an error or empty state, or the grid of dining hall cards. */
function MenuCardGrid({
  loading,
  error,
  onRetry,
  displayData,
  hasAnyRawData,
  dateKey,
  pinnedHalls,
  togglePinnedHall,
  stickyHeaders,
  date,
  meal,
  locationType,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  displayData: DisplayLocation[];
  hasAnyRawData: boolean;
  /** The day being shown, exposed on the grid for tests and debugging. */
  dateKey: string;
  pinnedHalls: DiningHall[];
  togglePinnedHall: (hall: DiningHall) => void;
  /** Keep each card's name in view while its list scrolls; only worthwhile with side-by-side cards. */
  stickyHeaders: boolean;
  date: Date;
  meal: Meal;
  locationType: LocationType;
}) {
  const theme = useTheme();

  if (loading) {
    return (
      <Pane
        display='grid'
        paddingBottom={majorScale(6)}
        gridTemplateColumns={GRID_COLUMNS}
        gap={majorScale(2)}
        className='skeleton-grid-enter'
      >
        {Array.from({ length: 6 }, (_, i) => (
          <DiningHallCardSkeleton key={i} />
        ))}
      </Pane>
    );
  }

  if (displayData.length === 0) {
    const failed = error !== null;
    return (
      <Pane
        display='flex'
        alignItems='center'
        justifyContent='center'
        paddingY={majorScale(8)}
        flexDirection='column'
        width='100%'
        marginTop={majorScale(2)}
        className='h-full'
        role={failed ? 'alert' : undefined}
      >
        {hasAnyRawData ? (
          <img src='/images/icons/funnel-x-dark.svg' width={50} height={50} alt='Filtered out' />
        ) : (
          <img
            src='/images/icons/no-food-dark.svg'
            width={70}
            height={70}
            alt='No menus available'
          />
        )}
        <Heading
          size={500}
          color={theme.colors.gray800}
          marginTop={majorScale(2)}
          marginBottom={minorScale(1)}
        >
          {failed ? "Couldn't load menus" : hasAnyRawData ? 'Filtered out' : 'Nothing today!'}
        </Heading>
        <Text size={400} color='black' opacity={0.4} textAlign='center' maxWidth={320}>
          {failed
            ? 'The menu service did not respond. Check your connection and try again.'
            : hasAnyRawData
              ? 'Try adjusting your search or filters'
              : "We couldn't find any menus for this meal. Check back later."}
        </Text>
        {failed && (
          <Button marginTop={majorScale(2)} onClick={onRetry}>
            Try again
          </Button>
        )}
      </Pane>
    );
  }

  // Cards keep their identity across day and meal changes, so only newly shown halls animate in.
  return (
    <Pane
      data-date={dateKey}
      display='grid'
      paddingBottom={majorScale(6)}
      gridTemplateColumns={GRID_COLUMNS}
      gap={majorScale(2)}
    >
      {displayData.map((diningHall, i) => (
        <DiningHallCard
          key={diningHall.name}
          diningHall={diningHall}
          isPinned={pinnedHalls.includes(diningHall.name as DiningHall)}
          onPinToggle={() => togglePinnedHall(diningHall.name as DiningHall)}
          index={i}
          stickyHeader={stickyHeaders}
          date={date}
          meal={meal}
          locationType={locationType}
        />
      ))}
    </Pane>
  );
}
