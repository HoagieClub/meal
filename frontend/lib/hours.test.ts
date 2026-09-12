import { expect, test } from 'bun:test';
import { DINING_HALLS, LOCATION_ID_BY_NAME, LOCATIONS } from '@/lib/constants';
import {
  formatPeriod,
  LOCATION_HOURS,
  mealPeriod,
  servesMeal,
  typicalMealRange,
} from '@/lib/hours';

// Local-midnight dates; the weekday is what matters.
const monday = new Date(2026, 8, 14);
const friday = new Date(2026, 8, 11);
const saturday = new Date(2026, 8, 12);

test('every displayed location has well-formed hours, and only Frist runs past midnight', () => {
  for (const hall of DINING_HALLS) {
    expect(LOCATION_HOURS[LOCATION_ID_BY_NAME[hall]]).toBeDefined();
  }
  for (const [id, week] of Object.entries(LOCATION_HOURS)) {
    expect(LOCATIONS[id]).toBeDefined();
    for (const periods of Object.values(week)) {
      for (const period of periods) {
        expect(period.start).toMatch(/^\d{2}:\d{2}$/);
        expect(period.end).toMatch(/^\d{2}:\d{2}$/);
        if (period.end <= period.start) expect([id, period.label]).toEqual(['15', 'Late Night']);
      }
    }
  }
});

test('lookups: meal periods, closed days and the typical range', () => {
  expect(formatPeriod(mealPeriod('08', monday, 'Lunch')!)).toBe('11:30 AM - 3:00 PM');
  // The menu site files weekend brunch under "Lunch".
  expect(formatPeriod(mealPeriod('06', saturday, 'Lunch')!)).toBe('10:00 AM - 2:00 PM');
  expect(formatPeriod(mealPeriod('05', friday, 'Dinner')!)).toBe('After sundown');

  expect(servesMeal('04', friday, 'Lunch', 'residential')).toBe(false);
  expect(servesMeal('23', saturday, 'Lunch', 'retail')).toBe(false);
  // Locations without an hours entry are assumed open.
  expect(servesMeal('99', monday, 'Lunch', 'residential')).toBe(true);

  expect(typicalMealRange('Dinner', monday)).toBe('5:00 PM - 8:00 PM');
  expect(typicalMealRange('Lunch', saturday)).toBe('10:00 AM - 2:00 PM');
});
