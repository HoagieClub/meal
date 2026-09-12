import { DINING_HALLS, LOCATION_ID_BY_NAME, LOCATIONS } from '@/lib/constants';
import { isWeekend } from '@/lib/utils';
import type { LocationType, Meal } from '@/types';

/** Day of the week as returned by Date#getDay: Sunday is 0. */
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Period {
  /** Meal name for dining halls; "Open" for a cafe's hours; "Late Night" for Frist's late window. */
  label: string;
  /** "HH:MM", 24-hour. An end at or before the start means the period runs past midnight. */
  start: string;
  end: string;
  /** Shown instead of the times when they change weekly, such as CJL's sundown-based dinner. */
  display?: string;
}

type WeeklyHours = Record<Weekday, Period[]>;

const slot = (label: string, start: string, end: string, display?: string): Period =>
  display ? { label, start, end, display } : { label, start, end };
const CLOSED: Period[] = [];

/** Weekly hours from a Monday-to-Friday pattern, Saturday and Sunday, with optional per-day overrides. */
function week(
  weekdays: Period[],
  saturday: Period[],
  sunday: Period[],
  overrides: Partial<Record<Weekday, Period[]>> = {}
): WeeklyHours {
  return {
    0: sunday,
    1: weekdays,
    2: weekdays,
    3: weekdays,
    4: weekdays,
    5: weekdays,
    6: saturday,
    ...overrides,
  };
}

const HALL_WEEKDAY = [
  slot('Breakfast', '07:30', '11:00'),
  slot('Lunch', '11:30', '14:00'),
  slot('Dinner', '17:00', '20:00'),
];
const HALL_WEEKEND = [slot('Brunch', '10:00', '14:00'), slot('Dinner', '17:00', '20:00')];
const CAFE_WEEKDAY = [slot('Open', '08:00', '15:00')];

/**
 * Regular weekly hours for each location, keyed by the location id used in LOCATIONS.
 *
 * Source: dining.princeton.edu/locations-hours, week of 10 September 2026, cross-checked against
 * Campus Dining's hours-of-operation pages and Daily Princetonian coverage (see the notes per
 * location). These are the hours to expect in a normal semester week; breaks, holidays and
 * one-off closures are not modelled. Re-check them at the start of each semester.
 */
export const LOCATION_HOURS: Record<string, WeeklyHours> = {
  // Whitman & Butler: Butler eats in Whitman's Community Hall and both pages list the same hours.
  // The 3 PM lunch close is confirmed by Campus Dining's late-meal page. The weekend breakfast
  // is listed as 7:30-9:30 here; recess schedules have shown 7:30-8:30.
  '08': week(
    [
      slot('Breakfast', '07:30', '11:00'),
      slot('Lunch', '11:30', '15:00'),
      slot('Dinner', '17:00', '20:00'),
    ],
    [
      slot('Breakfast', '07:30', '09:30'),
      slot('Brunch', '10:00', '14:00'),
      slot('Dinner', '17:00', '20:00'),
    ],
    [
      slot('Breakfast', '07:30', '09:30'),
      slot('Brunch', '10:00', '14:00'),
      slot('Dinner', '17:00', '20:00'),
    ]
  ),
  // Yeh & Huo share Choi Dining Hall; both pages list the same hours.
  '06': week(HALL_WEEKDAY, HALL_WEEKEND, HALL_WEEKEND),
  // Mathey & Rockefeller share a servery. Breakfast is served on the Mathey side only, and Rocky's
  // page lists weekend brunch from 11:00; Mathey's times are used for the combined card. The
  // Princetonian reported the Rocky side serving lunch until 3 PM in fall 2025; the current
  // pages say 2 PM for both sides.
  '01': week(HALL_WEEKDAY, HALL_WEEKEND, HALL_WEEKEND),
  // Forbes.
  '03': week(HALL_WEEKDAY, HALL_WEEKEND, HALL_WEEKEND),
  // CJL: Friday and Saturday dinner follow sundown, so those times change week to week. Campus
  // Dining's academic-year page lists weekday dinner ending at 7:00; the location page says 7:30.
  '05': week(
    [
      slot('Breakfast', '08:00', '09:00'),
      slot('Lunch', '11:30', '13:30'),
      slot('Dinner', '17:30', '19:30'),
    ],
    [slot('Brunch', '12:00', '14:30'), slot('Dinner', '20:15', '21:15', 'After sundown')],
    [slot('Brunch', '12:30', '14:30'), slot('Dinner', '17:30', '19:30')],
    {
      5: [
        slot('Breakfast', '08:00', '09:00'),
        slot('Lunch', '11:30', '13:30'),
        slot('Dinner', '20:00', '21:30', 'After sundown'),
      ],
    }
  ),
  // Graduate College: no lunch on weekdays, closed Friday and Saturday, brunch only on Sunday.
  // Five months of scraped menus show the same pattern.
  '04': week(
    [slot('Breakfast', '07:30', '09:30'), slot('Dinner', '17:00', '20:00')],
    CLOSED,
    [slot('Brunch', '11:00', '14:00')],
    { 5: CLOSED }
  ),
  // Frist Gallery. Weekday hours match the late-meal windows (late lunch 2-4 Mon-Fri, late dinner
  // 8:30-10 Mon-Thu). The Saturday late-night window and Sunday closure come from a single week
  // and could not be confirmed elsewhere; they are the least certain entries here.
  '15': week(
    [slot('Open', '08:00', '22:00')],
    [slot('Open', '11:00', '17:00'), slot('Late Night', '23:00', '02:00')],
    CLOSED,
    { 5: [slot('Open', '08:00', '16:00')] }
  ),
  // Satellite cafes: 8-3 on weekdays, confirmed by Campus Dining's retail hours page. Genomics was
  // listed closed one Friday, but menus show it normally open.
  '23': week(CAFE_WEEKDAY, CLOSED, CLOSED),
  '24': week(CAFE_WEEKDAY, CLOSED, CLOSED),
  '26': week(CAFE_WEEKDAY, CLOSED, CLOSED),
  '07': week(CAFE_WEEKDAY, CLOSED, CLOSED),
  // Tiger Tea Room and Witherspoon's publish no menus, but their hours are kept for completeness.
  // The retail hours page lists the Tea Room opening at 10:00; its location page says 9:00.
  '12': week([slot('Open', '09:00', '18:30')], CLOSED, CLOSED),
  '16': week(
    [slot('Open', '08:00', '18:00')],
    [slot('Open', '11:00', '21:00')],
    [slot('Open', '11:00', '21:00')]
  ),
};

/** "07:30" -> "7:30 AM". */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

export function formatPeriod(period: Period): string {
  return period.display ?? `${formatTime(period.start)} - ${formatTime(period.end)}`;
}

function periodsFor(locationId: string, date: Date): Period[] {
  return LOCATION_HOURS[locationId]?.[date.getDay() as Weekday] ?? [];
}

/** The period serving `meal` at a hall on `date`. The menu site files weekend brunch under "Lunch". */
export function mealPeriod(locationId: string, date: Date, meal: Meal): Period | undefined {
  const labels = meal === 'Lunch' && isWeekend(date) ? ['Brunch', 'Lunch'] : [meal];
  return periodsFor(locationId, date).find((period) => labels.includes(period.label));
}

/**
 * Whether a hall serves `meal` on `date`, or a cafe opens at all that day. Locations without an
 * hours entry are assumed to be open, so their empty cards say "nothing published" rather than
 * "closed".
 */
export function servesMeal(
  locationId: string,
  date: Date,
  meal: Meal,
  locationType: LocationType
): boolean {
  if (!(locationId in LOCATION_HOURS)) return true;
  return locationType === 'residential'
    ? mealPeriod(locationId, date, meal) !== undefined
    : periodsFor(locationId, date).length > 0;
}

/** The most common hours for a meal across the dining halls on that day of the week. */
export function typicalMealRange(meal: Meal, date: Date): string | null {
  const counts = new Map<string, number>();
  for (const hall of DINING_HALLS) {
    const id = LOCATION_ID_BY_NAME[hall];
    if (LOCATIONS[id]?.category !== 'residential') continue;
    const period = mealPeriod(id, date, meal);
    if (!period || period.display) continue;
    const range = formatPeriod(period);
    counts.set(range, (counts.get(range) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [range, count] of counts) {
    if (count > bestCount) [best, bestCount] = [range, count];
  }
  return best;
}
