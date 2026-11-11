import { expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import type { RatingCampaign } from '@/types';
import { RatingCampaignBannerContent } from './rating-campaign';

const campaign: RatingCampaign = {
  startsOn: '2026-11-11',
  endsOn: '2026-11-14',
  today: '2026-11-13',
  prize: 'any Amazon item up to $100',
  goal: 500,
  ratingsPerTicket: 1,
  user: null,
};

const renderBanner = (overrides: Partial<RatingCampaign>, totalRatings = 1240) =>
  render(
    <RatingCampaignBannerContent
      totalRatings={totalRatings}
      campaign={{ ...campaign, ...overrides }}
      onDismiss={() => {}}
    />
  );

test('a logged-out visitor sees the campus count, the goal, the rule and a way in', () => {
  renderBanner({});
  expect(screen.getByRole('region', { name: 'Rating raffle' }).textContent).toContain(
    '1,240 ratings from Princeton students'
  );
  expect(screen.getByText('Goal reached!')).toBeTruthy();
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('500');
  expect(
    screen.getByText(
      "Rate a dish from that day's menu each day through Nov 14 for a raffle ticket to win any Amazon item up to $100."
    )
  ).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Log in to enter' }).getAttribute('href')).toStartWith(
    '/api/auth/login?returnTo='
  );
  expect(screen.queryByRole('list', { name: 'Your raffle tickets' })).toBeNull();
});

test('a logged-in student sees a chip per day and their tickets', () => {
  renderBanner({ user: { ticketDays: ['2026-11-11'], ratedToday: 0 } }, 120);
  expect(screen.getByText('Goal 500')).toBeTruthy();
  expect(screen.queryByRole('link', { name: 'Log in to enter' })).toBeNull();
  const days = screen.getAllByRole('listitem').map((chip) => chip.getAttribute('aria-label'));
  expect(days).toEqual([
    'Wed: ticket earned',
    'Thu: no ticket',
    'Fri: today, no ticket yet',
    'Sat: still to come',
  ]);
  expect(screen.getByText("1 ticket · rate one from today's menu for another")).toBeTruthy();
});

test('without a prize or goal it is just the count, and it can be dismissed', () => {
  const onDismiss = mock(() => {});
  render(
    <RatingCampaignBannerContent
      totalRatings={0}
      campaign={{ ...campaign, prize: '', goal: null, user: { ticketDays: [], ratedToday: 0 } }}
      onDismiss={onDismiss}
    />
  );
  expect(screen.getByText('No ratings yet. Be the first!')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(screen.queryByText(/raffle/)).toBeNull();
  expect(screen.queryByRole('list')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
