import { expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import DateMealSelector from './date-meal-selector';

const saturday = new Date(2026, 8, 12);
const friday = new Date(2026, 8, 11);

function renderSelector(overrides: Partial<Parameters<typeof DateMealSelector>[0]> = {}) {
  const props = {
    meal: 'Lunch',
    setMeal: mock(() => {}),
    meals: ['Breakfast', 'Lunch', 'Dinner'],
    selectedDate: friday,
    setSelectedDate: mock(() => {}),
    locationType: 'residential' as const,
    ...overrides,
  };
  render(<DateMealSelector {...props} />);
  return props;
}

test('tabs follow the meals served, weekend lunch reads Brunch, and picks call back', () => {
  const props = renderSelector();
  const tabs = screen.getAllByRole('tab');
  expect(tabs.map((tab) => tab.textContent)).toEqual(['Breakfast', 'Lunch', 'Dinner']);
  expect(tabs[1].getAttribute('aria-selected')).toBe('true');

  fireEvent.click(screen.getByText('Dinner'));
  expect(props.setMeal).toHaveBeenCalledWith('Dinner');
  fireEvent.click(screen.getByLabelText('Next day'));
  const [nextDate] = (props.setSelectedDate as ReturnType<typeof mock>).mock.calls[0] as [Date];
  expect(nextDate.getDate()).toBe(12);

  cleanup();
  renderSelector({ meals: ['Lunch', 'Dinner'], selectedDate: saturday });
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Brunch', 'Dinner']);

  cleanup();
  renderSelector({ locationType: 'retail' });
  expect(screen.queryAllByRole('tab')).toHaveLength(0);
});
